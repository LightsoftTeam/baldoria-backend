import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { GetReservationsDto } from './dto/get-reservations.dto';
import { Reservation } from 'src/users/entities/user.entity';
import { UseReservationError, useReservationErrors } from './constants/use-reservation-errors';
import { DateTime } from 'luxon';
import { ErrorApp } from 'src/common/interfaces/error-app.interface';
import { DocumentFormat } from 'src/common/helpers/document-format.helper';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly userService: UsersService
  ) { }

  async findAll(getReservationsDto: GetReservationsDto) {
    const { from, to, enterprise } = getReservationsDto;
    console.log({ from: new Date(from).toISOString() })
    return this.userService.getReservations({from, to, enterprise});
  }

  // async findOne(id: string): Promise<Reservation | null> {
  //   const reservation = await this.userService.getReservationById(id);
  //   return reservation;
  // }

  async use(id: string) {
    return this.userService.useReservation(id);
  }

  async getQrInfo(id: string) {
    const user = await this.userService.getUserByReservationId(id);
    if(!user){
      console.log('User not found by reservation id');
      throw new NotFoundException('Item not found');
    }
    const reservationsState = await this.getRevervationStatus(id);
    const reservation = user.reservations.find(reservation => reservation.id === id);
    return {
      user: DocumentFormat.cleanDocument(user, ['reservations']),
      reservationsState,
      reservation
    };
  }

  async getRevervationStatus(reservationId: string): Promise<{
    isValid: boolean;
    error: ErrorApp | null;
  }> {
    const reservation = await this.userService.getReservationById(reservationId);
    if(!reservation){
      throw new NotFoundException('Reservation not found');
    }
    const usedAt = reservation.usedAt;
    if(usedAt){
      return {
        isValid: false,
        error: {
          ...useReservationErrors.ALREADY_USED,
          message: 'La reserva fue usada el día ' + usedAt
        }
      };
    }
    const reservationDate = reservation.date.toString();
    const reservationDateLuxon = DateTime.fromISO(reservationDate, {
      zone: 'utc'
    }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    const todayLuxon = DateTime.now()
    .setZone('utc')
    .minus({hours: 5})
    .set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
    const reservationInDate = !(reservationDateLuxon < todayLuxon || reservationDateLuxon > todayLuxon);
    console.log({reservationInDate})
    if(!reservationInDate){
      return {
        isValid: false,
        error: {
          ...useReservationErrors.DATE_NOT_VALID,
          message: 'La fecha de la reserva es ' + reservationDate
        }
      };
    }
    return {
      isValid: true,
      error: null
    };
  }
}
