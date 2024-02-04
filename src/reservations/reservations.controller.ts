import { Controller, Get, Post, Body, Query, NotFoundException, BadRequestException, HttpCode, HttpStatus } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { CreateReservationDto } from './dto/create-reservation.dto';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetReservationsDto } from './dto/get-reservations.dto';
import { UseReservationDto } from './dto/use-reservation.dto';
import { UseReservationError, useReservationErrors } from './constants/use-reservation-errors';
import { DateTime } from 'luxon';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) {}

  // @ApiOperation({ summary: 'Register a reservation' })
  // @ApiResponse({ status: 201, description: 'The reservation has been successfully created.'})
  // @ApiResponse({ status: 404, description: 'User not found.'})
  // @Post()
  // create(@Body() createReservationDto: CreateReservationDto) {
  //   return this.reservationsService.create(createReservationDto);
  // }

  // @ApiOperation({ summary: 'Get reservations by enterprise and dates range' })
  // @ApiResponse({ status: 200, description: 'The reservations has been successfully retrieved.'})
  // @Get()
  // findAll(@Query() getReservationsDto: GetReservationsDto) {
  //   //TODO: add query params to filter by date and enterprise
  //   return this.reservationsService.findAll(getReservationsDto);
  // }

  // @HttpCode(HttpStatus.OK)
  // @ApiOperation({ summary: 'Use Reservation' })
  // @ApiOkResponse({ description: 'The reservation has been successfully used.'})
  // @ApiBadRequestResponse({ description: 'Reservation already used or date is in the past.', schema: {
  //   type: 'object',
  //   properties: {
  //     error: {
  //       type: 'string',
  //       enum: Object.values(UseReservationError)
  //     },
  //     message: {
  //       type: 'string',
  //     }
  //   }
  // }})
  // @ApiNotFoundResponse({ description: 'Reservation not found.'})
  // @Post('use')
  // @ApiParam({ name: 'id', description: 'Reservation Id' })
  // async use(@Body() useReservationDto: UseReservationDto) {
  //   const { id } = useReservationDto;
  //   const reservation = await this.reservationsService.findOne(id);
  //   if(!reservation){
  //     throw new NotFoundException('Reservation not found');
  //   }
  //   const usedAt = reservation.usedAt;
  //   if(usedAt){
  //     throw new BadRequestException({
  //       ...useReservationErrors.ALREADY_USED,
  //       message: 'La reserva fue usada el día ' + usedAt
  //     });
  //   }
  //   const reservationDate = reservation.date.toString();
  //   const reservationDateLuxon = DateTime.fromISO(reservationDate, {
  //     zone: 'utc'
  //   }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  //   const todayLuxon = DateTime.now()
  //   .setZone('utc')
  //   .minus({hours: 5})
  //   .set({ hour: 0, minute: 0, second: 0, millisecond: 0 });
  //   const reservationInDate = reservationDateLuxon === todayLuxon;
  //   console.log({reservationInDate})
  //   if(!reservationInDate){
  //     throw new BadRequestException({
  //       ...useReservationErrors.DATE_IN_PAST,
  //       message: 'La fecha de la reserva es ' + reservationDate
  //     });
  //   }
  //   const newReservation = {
  //     ...reservation,
  //     usedAt: DateTime.local().minus({ hours: 5 }).toJSDate(),
  //   }
  //   return this.reservationsService.update(id, newReservation);
  // }
}
