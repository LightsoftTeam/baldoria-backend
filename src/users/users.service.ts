import { Inject, Injectable, NotFoundException, forwardRef } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { CreateUserDto } from './dto/create-user.dto';
import { InjectModel } from '@nestjs/azure-database';
import type { Container } from '@azure/cosmos';
import { Reservation, Role, User } from './entities/user.entity';
import { GetClientDto } from './dto/get-client.dto';
import { DateTime } from 'luxon';
import { GetUsersDto, SortBy } from './dto/get-users.dto';
import { Sort } from 'src/common/interfaces/sort.enum';
import { Enterprise } from 'src/reservations/entities/reservation.entity';
import { ReservationsService } from 'src/reservations/reservations.service';
import { AddReservationDto } from './dto/add-reservation.dto';

@Injectable()
export class UsersService {

  constructor(
    @InjectModel(User)
    private readonly userContainer: Container,
    @Inject(forwardRef(() => ReservationsService))
    private readonly reservationsService: ReservationsService,
  ) { }

  async create(createUserDto: CreateUserDto) {
    const user = {
      ...createUserDto,
      role: Role.CLIENT,
      reservations: [],
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
        and contains(c.firstName, @search, true) or contains(c.lastName, @search, true) or contains(c.email, @search, true) 
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
        SELECT * FROM c 
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

    const users = items.resources;
    const total = count.resources[0];

    const userIds = users.map(user => user.id);

    console.log({userIds})

    const reservationsByUser = await this.reservationsService.getNumberOfReservationsByUserId(userIds);

    const data = users.map(user => {
      const userReservations = reservationsByUser.filter(reservation => reservation.userId === user.id);
      const reservationsCount = Object.values(Enterprise).reduce((acc, enterprise) => {
        const enterpriseReservations = userReservations.find(reservation => reservation.enterprise === enterprise);
        return {
          ...acc,
          [enterprise]: enterpriseReservations ? enterpriseReservations.total : 0
        }
      }, {} as Record<Enterprise, number>);
      return {
        ...user,
        reservationsInfo: reservationsCount
      }
    });

    return {
      data,
      meta: {
        page,
        limit,
        total
      }
    };
  }

  async getClient(getClientDto: GetClientDto) {
    const { documentType, documentNumber } = getClientDto;
    const querySpec = {
      query: 'SELECT * FROM c where c.role = "client" and c.documentType = @documentType and c.documentNumber = @documentNumber',
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
    // const {resource: user} = await this.userContainer.item(id).read<User>();
    // return user;
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
   if(resources.length === 0){
      throw new NotFoundException('User not found');
    }
   const user = resources[0];
   const existReservation = user.reservations.find((reservation: Reservation) => {
     return reservation.date.toString().split('T')[0] === date && reservation.enterprise === enterprise;
   });
   if(!existReservation){
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

 private async addReservationToUser(userId: string, addReservationDto: AddReservationDto): Promise<Reservation>{
   const user = await this.findOne(userId);//throw error if user not found
   const reservation: Reservation = {
      id: uuid(),
     ...addReservationDto,
     needParking: addReservationDto.needParking ?? false,
     //TODO: validate date format YYYY-mm-dd
     date: new Date(addReservationDto.date),
     createdAt: DateTime.local().minus({ hours: 5 }).toJSDate()
   }
   const newUser = {
      ...user,
      reservations: [...user.reservations, reservation]
   }
    await this.userContainer.item(userId).replace(newUser);
    return reservation;
 }
}
