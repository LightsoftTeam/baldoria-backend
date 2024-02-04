import { Injectable, NotFoundException } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/azure-database';
import type { Container } from '@azure/cosmos';
import { Enterprise, Reservation, Role, User } from './entities/user.entity';
import { GetClientDto } from './dto/get-client.dto';
import { DateTime } from 'luxon';
import { GetUsersDto, SortBy } from './dto/get-users.dto';
import { Sort } from 'src/common/interfaces/sort.enum';
import { AddReservationDto } from './dto/add-reservation.dto';
import { DocumentFormat } from 'src/common/helpers/document-format.helper';

export const BASIC_FIELDS = [
  'c.id', 'c.firstName', 'c.lastName', 'c.documentType', 'c.documentNumber', 'c.email', 'c.phoneCode', 'c.phoneNumber', 'c.role'
]

@Injectable()
export class UsersService {

  constructor(
    @InjectModel(User)
    private readonly userContainer: Container,
  ) { }

  async create(createUserDto: CreateUserDto) {
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
    return resource;
  }

  async findAll(getUsersDto: GetUsersDto): Promise<{
    data: User[],
    meta: {
      page: number,
      limit: number,
      total: number
    }
  }> {
    const { page: pageString = '1', limit: limitString = '10', search = '', sort = Sort.DESC, sortBy = SortBy.CREATED_AT } = getUsersDto;
    const page = parseInt(pageString);
    const limit = parseInt(limitString);
    const offset = (page - 1) * limit;

    const whereClause = `
        where c.role = "client"
        and (contains(c.firstName, @search, true) or contains(c.lastName, @search, true) or contains(c.email, @search, true))
    `;

    const countQuerySpec = {
      query: `
        SELECT VALUE COUNT(1) FROM c 
        ${whereClause}
      `,
      parameters: [
        {
          name: '@search',
          value: search
        }
      ]
    };

    const itemsQuerySpec = {
      query: `
        SELECT ${BASIC_FIELDS.join(',')},c.lovCount, c.baldoriaCount FROM c 
        ${whereClause}
        order by c.${sortBy} ${sort} 
        offset @offset limit @limit
      `,
      parameters: [
        {
          name: '@search',
          value: search
        },
        {
          name: '@offset',
          value: offset
        },
        {
          name: '@limit',
          value: limit
        }
      ]
    };

    const countPromise = this.userContainer.items
      .query<number>(countQuerySpec)
      .fetchAll();
    const itemsPromise = this.userContainer.items
      .query<User>(itemsQuerySpec)
      .fetchAll();

    const [items, count] = await Promise.all([itemsPromise, countPromise]);

    const data = items.resources;
    const total = count.resources[0];

    return {
      data,
      meta: {
        page,
        limit,
        total
      }
    };
  }

  async getClient(getClientDto: GetClientDto): Promise<Partial<User>> {
    const { documentType, documentNumber } = getClientDto;
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
    const querySpec = {
      query: 'SELECT * FROM c where c.id = @id and c.role = "client"',
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

  async findByIds(ids: string[]) {
    const querySpec = {
      query: 'SELECT * FROM c where ARRAY_CONTAINS(@ids, c.id)',
      parameters: [
        {
          name: '@ids',
          value: ids
        }
      ]
    };
    const { resources } = await this.userContainer.items
      .query<User>(querySpec)
      .fetchAll();
    return resources;
  }

  async getReservations({ enterprise, from, to }: {
    enterprise: Enterprise,
    from: string,
    to: string
  }) {
    const reservationQuerySpec = {
      query: `
        SELECT c as user
        FROM c 
        JOIN r in c.reservations 
        where r.createdAt >= @from and r.createdAt <= @to and r.enterprise = @enterprise
      `,
      parameters: [
        {
          name: "@enterprise",
          value: enterprise
        },
        {
          name: "@from",
          value: new Date(from).toISOString()
        },
        {
          name: "@to",
          value: new Date(to).toISOString()
        }
      ],
    };
    const { resources } = await this.userContainer.items.query<{
      "user": User,
    }>(
      reservationQuerySpec
    ).fetchAll();

    const users = resources.map(resource => resource.user);
    const reservations = users.flatMap(({ reservations, ...user }) => {
      const filteredReservations = reservations.filter(reservation => reservation.enterprise === enterprise);
      const filteredReservationsWithUser = filteredReservations.map(reservation => {
        return {
          ...reservation,
          user: DocumentFormat.cleanDocument(user, ['password']),
        }
      }
      );
      return filteredReservationsWithUser;
    });
    return reservations;
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
      return reservation.date.toString().split('T')[0] === date && reservation.enterprise === enterprise;
    });
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
    const user = await this.getUserByReservationId(reservationId);
    const newReservations = user.reservations.map(reservation => {
      if (reservation.id === reservationId) {
        return {
          ...reservation,
          usedAt: DateTime.local().minus({ hours: 5 }).toJSDate()
        }
      }
      return reservation;
    }
    );
    const { resource } = await this.userContainer.item(user.id).replace<User>({
      ...user,
      reservations: newReservations
    });
    return resource;
  }

  private async getUserByReservationId(reservationId: string) {
    const { resources } = await this.userContainer.items.query<User>({
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
      return null;
    }
    return resources[0];
  }
}
