import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/azure-database';
import type { Container } from '@azure/cosmos';
import { Enterprise, Reservation, Role, User } from './entities/user.entity';
import { GetClientDto } from './dto/get-client.dto';
import { DateTime } from 'luxon';
import { AddReservationDto } from './dto/add-reservation.dto';
import { DocumentFormat } from 'src/common/helpers/document-format.helper';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';

export const BASIC_FIELDS = [
  'c.id', 'c.firstName', 'c.lastName', 'c.documentType', 'c.birthdate', 'c.documentNumber', 'c.email', 'c.phoneCode', 'c.phoneNumber', 'c.role'
]

@Injectable()
export class UsersService {

  constructor(
    @InjectModel(User)
    private readonly userContainer: Container,
    private readonly logger: ApplicationLoggerService
  ) { }

  async create(createUserDto: CreateUserDto) {
    this.logger.debug(`createUserDto ${JSON.stringify(createUserDto)}`);
    const { documentNumber, documentType } = createUserDto;
    const querySpec = {
      query: 'SELECT * FROM c where c.documentNumber = @documentNumber and c.documentType = @documentType',
      parameters: [
        {
          name: '@documentNumber',
          value: documentNumber
        },
        {
          name: '@documentType',
          value: documentType
        }
      ]
    };
    const users = await this.userContainer.items
      .query<User>(querySpec)
      .fetchAll();
    if (users.resources.length > 0) {
      this.logger.log(`User with documentNumber ${documentNumber} and documentType ${documentType} already exists`);
      const existingUser = users.resources[0];
      const {birthdate, email, firstName, lastName, phoneCode, phoneNumber} = createUserDto;
      const updatedUser = {
        ...existingUser,
        birthdate: new Date(birthdate),
        email,
        firstName,
        lastName,
        phoneCode,
        phoneNumber
      }
      const {resource} = await this.userContainer.item(existingUser.id).replace<User>(updatedUser);
      return DocumentFormat.cleanDocument(resource, ['password', 'reservations']);
    }
    this.logger.log(`Creating user with documentNumber ${documentNumber} and documentType ${documentType}`);
    const user = {
      ...createUserDto,
      role: Role.CLIENT,
      reservations: [],
      lovCount: 0,
      baldoriaCount: 0,
      //TODO: validate birthdate format YYYY-mm-dd
      birthdate: new Date(createUserDto.birthdate),
      createdAt: DateTime.local().minus({ hours: 5 }).toJSDate(),
    }
    const { resource } = await this.userContainer.items.create<User>(
      user
    );
    return DocumentFormat.cleanDocument(resource, ['password', 'reservations']);
  }

  async findAll(): Promise<User[]> {
    const itemsQuerySpec = {
      query: `
        SELECT ${BASIC_FIELDS.join(',')},c.lovCount, c.baldoriaCount FROM c 
        where c.role = @role
      `,
      parameters: [
        {
          name: '@role',
          value: 'client'
        }
      ]
    };

    const { resources } = await this.userContainer.items
      .query<User>(itemsQuerySpec)
      .fetchAll();

    return resources;
  }

  async getClient(getClientDto: GetClientDto): Promise<Partial<User>> {
    const { documentType, documentNumber } = getClientDto;
    this.logger.debug(`getClientDto ${JSON.stringify(getClientDto)}`);
    const querySpec = {
      query: `
        SELECT ${BASIC_FIELDS.join(',')}
        FROM c where c.role = "client" and c.documentType = @documentType and c.documentNumber = @documentNumber`,
      parameters: [
        {
          name: '@documentType',
          value: documentType
        },
        {
          name: '@documentNumber',
          value: documentNumber
        }
      ]
    };
    const { resources } = await this.userContainer.items
      .query<User>(querySpec)
      .fetchAll();
    if (resources.length < 0) {
      return null;
    }
    return resources[0];
  }

  async findOne(id: string) {
    //TODO: review if its necesary to remove password and reservations. Role
    const querySpec = {
      query: 'SELECT * FROM c where c.id = @id',
      parameters: [
        {
          name: '@id',
          value: id
        }
      ]
    };
    const { resources } = await this.userContainer.items
      .query<User>(querySpec)
      .fetchAll();
    if (resources.length === 0) {
      throw new NotFoundException('User not found');
    }
    return resources[0];
  }

  async findByEmail(email: string) {
    const querySpec = {
      query: 'SELECT * FROM c where c.role = "admin" and c.email = @email',
      parameters: [
        {
          name: '@email',
          value: email
        }
      ]
    };
    const { resources } = await this.userContainer.items
      .query<User>(querySpec)
      .fetchAll();
    if (resources.length < 0) {
      return null;
    }
    return resources[0];
  }

  async getReservations({ enterprise, date }: {
    enterprise: Enterprise,
    date: string,
  }) {
    const dateIso = new Date(date).toISOString();
    this.logger.debug(`getReservations enterprise ${enterprise} date ${dateIso}`);
    const reservationQuerySpec = {
      query: `
        SELECT ${BASIC_FIELDS.join(',')}, 
        ARRAY (
          SELECT * 
          FROM r IN c.reservations 
          WHERE r.date >= @date and r.date <= @date AND r.enterprise = @enterprise
        ) as reservations FROM c
      `,
      parameters: [
        {
          name: "@enterprise",
          value: enterprise
        },
        {
          name: "@date",
          value: dateIso
        }
      ],
    };
    const startDate = new Date();
    const { resources } = await this.userContainer.items.query<User>(reservationQuerySpec).fetchAll();
    const endDate = new Date();
    this.logger.log(`getReservations query time ${endDate.getTime() - startDate.getTime()} ms`);
    const response = resources.map(({reservations, ...user}) => {
      if (reservations.length === 0) {
        return null;
      }
      if(reservations.length > 1){
        this.logger.error('More than one reservation found');
      }
      const reservation = reservations[0];
      return {
        ...reservation,
        user
      }
    });
    return response.filter(Boolean);
  }

  async getUsersWithVisits({ from, to }: {
    from: string,
    to: string,
  }) {
    const fromIso = new Date(from).toISOString();
    const toIso = new Date(to).toISOString();
    this.logger.debug(`getReservations from ${fromIso} to ${toIso}`);
    const reservationQuerySpec = {
      query: `
        SELECT ${BASIC_FIELDS.join(',')}, 
        ARRAY (
          SELECT * 
          FROM r IN c.reservations 
          WHERE r.date >= @from and r.date <= @to
        ) as reservations FROM c
        WHERE c.role = 'client'
      `,
      parameters: [
        {
          name: "@from",
          value: fromIso
        },
        {
          name: "@to",
          value: toIso
        }
      ],
    };
    const startDate = new Date();
    const { resources } = await this.userContainer.items.query<User>(reservationQuerySpec).fetchAll();
    const endDate = new Date();
    this.logger.log(`getUsersWithReservations query time ${endDate.getTime() - startDate.getTime()} ms`);
    const response = resources.map(({reservations, ...user}) => {
      const baldoriaReservations = reservations.filter(reservation => reservation.enterprise === Enterprise.BALDORIA);
      const lovReservations = reservations.filter(reservation => reservation.enterprise === Enterprise.LOV);
      const usedBaldoriaReservations = baldoriaReservations.filter(reservation => reservation.usedAt);
      const usedLovReservations = lovReservations.filter(reservation => reservation.usedAt);
      return {
        ...user,
        baldoriaReservations: baldoriaReservations.length,
        lovReservations: lovReservations.length,
        usedBaldoriaReservations: usedBaldoriaReservations.length,
        usedLovReservations: usedLovReservations.length
      }
    });
    return response;
  }

  async getReservationById(reservationId: string): Promise<Reservation | null> {
    const querySpec = {
      query: `
        select value r 
        from c join r in c.reservations
        where r.id = @reservationId
      `,
      parameters: [
        {
          name: "@reservationId",
          value: reservationId
        }
      ]
    };
    const { resources } = await this.userContainer.items.query<Reservation>(
      querySpec
    ).fetchAll();
    if (resources.length === 0) {
      return null;
    }
    return resources[0];
  }

  async getReservationsByUserId(userId: string) {
    const user = await this.findOne(userId);
    return user.reservations;
  }

  async addReservation(userId: string, addReservationDto: AddReservationDto) {
    this.logger.debug(`addReservationDto ${JSON.stringify(addReservationDto)}`);
    //TODO: validate date format YYYY-mm-dd
    const { date, enterprise } = addReservationDto;
    const userQuerySpec = {
      query: `SELECT * from c where c.id = @userId`,
      parameters: [
        {
          name: "@userId",
          value: userId
        }
      ]
    };
    const { resources } = await this.userContainer.items.query(
      userQuerySpec
    ).fetchAll();
    if (resources.length === 0) {
      throw new NotFoundException('User not found');
    }
    const user = resources[0];
    const existReservation = user.reservations.find((reservation: Reservation) => {
      const dateBd = reservation.date.toString().split('T')[0];
      const enterpriseBd = reservation.enterprise;
      this.logger.debug(`dateBd ${dateBd} date ${date} enterpriseBd ${enterpriseBd} enterprise ${enterprise}`);
      return dateBd === date && enterpriseBd === enterprise;
    });
    this.logger.debug(`existReservation ${JSON.stringify(existReservation)}`);
    if (!existReservation) {
      const newReservation = await this.addReservationToUser(userId, addReservationDto);
      return {
        reservation: newReservation,
        isNew: true
      }
    }

    return {
      reservation: existReservation,
      isNew: false
    }
  }

  private async addReservationToUser(userId: string, addReservationDto: AddReservationDto): Promise<Reservation> {
    this.logger.debug(`addReservationToUser ${userId}`);
    const user = await this.findOne(userId);//throw error if user not found
    const reservation: Reservation = {
      id: uuid(),
      ...addReservationDto,
      needParking: addReservationDto.needParking ?? false,
      //TODO: validate date format YYYY-mm-dd
      date: new Date(addReservationDto.date),
      createdAt: DateTime.local().minus({ hours: 5 }).toJSDate()
    }
    const newReservations = [...user.reservations, reservation];
    const newUser = {
      ...user,
      reservations: newReservations,
      lovCount: newReservations.filter(reservation => reservation.enterprise === Enterprise.LOV).length,
      baldoriaCount: newReservations.filter(reservation => reservation.enterprise === Enterprise.BALDORIA).length
    }
    await this.userContainer.item(userId).replace(newUser);
    return reservation;
  }

  async useReservation(reservationId: string) {
    this.logger.debug(`useReservation ${reservationId}`);
    const usedAt = DateTime.utc().minus({hours: 5}).toJSDate();
    this.logger.debug(`usedAt ${usedAt}`);
    const user = await this.getUserByReservationId(reservationId);
    const newReservations = user.reservations.map(reservation => {
      if (reservation.id === reservationId) {
        return {
          ...reservation,
          usedAt
        }
      }
      return reservation;
    }
    );
    await this.userContainer.item(user.id).replace<User>({
      ...user,
      reservations: newReservations
    });
    return {usedAt};
  }

  async getUserByReservationId(reservationId: string): Promise<User | null>{
    this.logger.debug(`getUserByReservationId ${reservationId}`);
    const { resources } = await this.userContainer.items.query<{
      c: User
    }>({
      query: `
        SELECT c 
        FROM c 
        JOIN r in c.reservations 
        where r.id = @reservationId
      `,
      parameters: [
        {
          name: "@reservationId",
          value: reservationId
        }
      ]
    }).fetchAll();
    if (resources.length === 0) {
      this.logger.debug(`getUserByReservationId: ${reservationId} not found`);
      return null;
    }
    return resources[0].c;
  }
}
