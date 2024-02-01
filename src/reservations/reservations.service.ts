import { Injectable } from '@nestjs/common';
import type { Container } from '@azure/cosmos';
import { DateTime } from 'luxon';
import { v4 as uuid } from "uuid";
import { CreateReservationDto } from './dto/create-reservation.dto';
import { InjectModel } from '@nestjs/azure-database';
import { Reservation } from './entities/reservation.entity';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class ReservationsService {
  constructor(
    @InjectModel(Reservation)
    private readonly reservationContainer: Container,
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
    console.log({reservationQuerySpec: JSON.stringify(reservationQuerySpec, null, 2)})
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
    const reservation = {
      ...createReservationDto,
      hash: uuid(),
      isUsed: false,
      needParking: createReservationDto.needParking || false,
      //TODO: validate date format YYYY-mm-dd
      date: new Date(createReservationDto.date),
      createdAt: DateTime.local().minus({ hours: 5 }).toJSDate(),
    }
    const { resource } = await this.reservationContainer.items.create<Reservation>(
      reservation
    );
    return resource;
  }

  findAll() {
    return `This action returns all reservations`;
  }
}
