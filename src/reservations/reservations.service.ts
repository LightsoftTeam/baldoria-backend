import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { GetReservationsDto } from './dto/get-reservations.dto';
import { useReservationErrors } from './constants/use-reservation-errors';
import { DateTime } from 'luxon';
import { ErrorApp } from 'src/common/interfaces/error-app.interface';
import { DocumentFormat } from 'src/common/helpers/document-format.helper';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';
import { GetVisitsDto } from './dto/get-visits.dto';

@Injectable()
export class ReservationsService {
  constructor(
    private readonly userService: UsersService,
    private readonly logger: ApplicationLoggerService
  ) { }

  async findAll(getReservationsDto: GetReservationsDto) {
    this.logger.log(`getReservationsDto ${JSON.stringify(getReservationsDto)}`);
    return this.userService.getReservations(getReservationsDto);
  }

  getUserVisitsInDateRange(getVisitsDto: GetVisitsDto) {
    this.logger.log('Finding reservations in date range');
    return this.userService.getUsersWithVisits(getVisitsDto);
  }

  // async findOne(id: string): Promise<Reservation | null> {
  //   const reservation = await this.userService.getReservationById(id);
  //   return reservation;
  // }

  async use(id: string) {
    this.logger.log('Using reservation');
    return this.userService.useReservation(id);
  }

  async getQrInfo(id: string) {
    this.logger.log('Getting qr info');
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
    this.logger.log('Getting reservation status');
    const reservation = await this.userService.getReservationById(reservationId);
    if(!reservation){
      throw new NotFoundException('Reservation not found');
    }
    const usedAt = reservation.usedAt;
    if(usedAt){
      this.logger.debug(`getRevervationStatus - reservation was used at: ${usedAt}`);
      return {
        isValid: false,
        error: {
          ...useReservationErrors.ALREADY_USED,
          message: 'La reserva fue usada el día ' + this.getStringDateFromUtcIso({isoDate: usedAt.toString(), withHour: true})
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
    this.logger.debug(`getRevervationStatus - comparing reservationInDate: ${reservationDateLuxon}, todayLuxon: ${todayLuxon}`);
    const reservationInDate = !(reservationDateLuxon < todayLuxon || reservationDateLuxon > todayLuxon);
    console.log({reservationInDate})
    if(!reservationInDate){
      return {
        isValid: false,
        error: {
          ...useReservationErrors.DATE_NOT_VALID,
          message: 'La fecha de la reserva es ' + this.getStringDateFromUtcIso({isoDate: reservationDate})
        }
      };
    }
    return {
      isValid: true,
      error: null
    };
  }

  getStringDateFromUtcIso({isoDate, withHour = false}: {isoDate: string, withHour?: boolean}) {
    const peruDate = DateTime.fromISO(isoDate, {zone: 'utc'}).toFormat(`dd/MM/yyyy${withHour ? ' HH:mm' : ''}`);
    this.logger.debug(`getStringDateFromUtcIso - isoDate: ${isoDate}, formattedDate: ${peruDate}`);
    return peruDate;
  }
}
