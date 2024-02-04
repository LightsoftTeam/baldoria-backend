import { Inject, Injectable, forwardRef } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { DateTime } from 'luxon';
import { v4 as uuid } from "uuid";
import { CreateReservationDto } from './dto/create-reservation.dto';
import { InjectModel } from '@nestjs/azure-database';
import { Reservation } from './entities/reservation.entity';
import { UsersService } from 'src/users/users.service';
import { GetReservationsDto } from './dto/get-reservations.dto';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation)
    private readonly reservationContainer: Container,
    @Inject(forwardRef(() => UsersService))
    private readonly userService: UsersService
  ) {}

  async create(createReservationDto: CreateReservationDto) {
    //TODO: validate date format YYYY-mm-dd
    const { date, enterprise, userId } = createReservationDto;
    const reservationQuerySpec = {
      query: 'SELECT * FROM c WHERE c.userId = @userId and c.date = @date and c.enterprise = @enterprise',
      parameters: [
        {
          name: "@userId",
          value: userId
        },
        {
          name: "@date",
          value: new Date(date).toISOString()
        },
        {
          name: "@enterprise",
          value: enterprise
        }
      ]
    };
    const { resources } = await this.reservationContainer.items.query<Reservation>(
      reservationQuerySpec
    ).fetchAll();
    const notExists = resources.length === 0;
    if (notExists) {
      const newReservation = await this.createAndGetAReservation(createReservationDto);
      return {
        reservation: newReservation,
        isNew: true
      }
    }
    return {
      reservation: resources[0],
      isNew: false
    }
  }

  private async createAndGetAReservation(createReservationDto: CreateReservationDto): Promise<Reservation>{
    const { userId } = createReservationDto;
    await this.userService.findOne(userId);//throw error if user not found
    const reservation: Reservation = {
      ...createReservationDto,
      needParking: createReservationDto.needParking ?? false,
      //TODO: validate date format YYYY-mm-dd
      date: new Date(createReservationDto.date),
      createdAt: DateTime.local().minus({ hours: 5 }).toJSDate()
    }
    const { resource } = await this.reservationContainer.items.create<Reservation>(
      reservation
    );
    return resource;
  }

  async findAll(getReservationsDto: GetReservationsDto) {
    const { from, to, enterprise } = getReservationsDto;
    const reservationQuerySpec = {
      query: 'SELECT * FROM c WHERE c.enterprise = @enterprise and c.date >= @from and c.date <= @to',
      parameters: [
        {
          name: "@enterprise",
          value: enterprise
        },
        {
          name: "@from",
          value: from
        },
        {
          name: "@to",
          value: to
        }
      ]
    };
    const {resources: reservations} = await this.reservationContainer.items.query<Reservation>(
      reservationQuerySpec
    ).fetchAll();

    const userIds = reservations.map(reservation => reservation.userId);
    const users = await this.userService.findByIds(userIds);

    const reservationsWithUsers = reservations.map(reservation => {
      const user = users.find(user => user.id === reservation.userId);
      return {
        ...reservation,
        user
      }
    });

    return reservationsWithUsers;
  }

  async findOne(id: string) {
    const reservationQuerySpec = {
      query: 'SELECT * FROM c WHERE c.id = @id',
      parameters: [
        {
          name: "@id",
          value: id
        }
      ]
    };
    const { resources } = await this.reservationContainer.items.query<Reservation>(
      reservationQuerySpec
    ).fetchAll();
    if(resources.length === 0){
      return null;
    }
    return resources[0];
  }

  async getNumberOfReservationsByUserId(userIds: string[]): Promise<{
    total: number,
    userId: string,
    enterprise: string
  }[]>{
    const querySpec = {
      query: `
        SELECT count(c.userId) as total, c.userId, c.enterprise 
        FROM c 
        where ARRAY_CONTAINS(@userIds, c.userId)
        GROUP BY c.enterprise, c.userId
      `,
      parameters: [
        {
          name: '@userIds',
          value: userIds
        }
      ]
    };

    const { resources } = await this.reservationContainer.items
      .query(querySpec)
      .fetchAll();
    return  resources;
  }

  async update(id: string, reservation: Reservation) {
    const { resource } = await this.reservationContainer.item(id).replace<Reservation>(reservation);
    return resource;
  }
}
