import { Controller, Get, Post, Body, Query, NotFoundException, BadRequestException, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ApiBadRequestResponse, ApiNotFoundResponse, ApiOkResponse, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetReservationsDto } from './dto/get-reservations.dto';
import { UseReservationDto } from './dto/use-reservation.dto';
import { UseReservationError, useReservationErrors } from './constants/use-reservation-errors';
import { DateTime } from 'luxon';
import { GetVisitsDto } from './dto/get-visits.dto';

@ApiTags('Reservations')
@Controller('reservations')
export class ReservationsController {
  constructor(private readonly reservationsService: ReservationsService) { }

  @ApiOperation({ summary: 'Get reservations by enterprise and dates range' })
  @ApiResponse({ status: 200, description: 'The reservations has been successfully retrieved.' })
  @Get()
  findAll(@Query() getReservationsDto: GetReservationsDto) {
    //TODO: add query params to filter by date and enterprise
    return this.reservationsService.findAll(getReservationsDto);
  }

  @Get('visits')
  getUserVisitsInRangeTime(@Query() getVisitsDto: GetVisitsDto) {
    return this.reservationsService.getUserVisitsInDateRange(getVisitsDto);
  }

  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Use Reservation' })
  @ApiOkResponse({ description: 'The reservation has been successfully used.' })
  @ApiBadRequestResponse({
    description: 'Reservation already used or date is in the past.', schema: {
      type: 'object',
      properties: {
        error: {
          type: 'string',
          enum: Object.values(UseReservationError)
        },
        message: {
          type: 'string',
        }
      }
    }
  })
  @ApiNotFoundResponse({ description: 'Reservation not found.' })
  @Post('use')
  @ApiParam({ name: 'id', description: 'Reservation Id' })
  async use(@Body() useReservationDto: UseReservationDto) {
    const { id } = useReservationDto;
    //TODO: this is neccesary?
    const reservationStatus = await this.reservationsService.getRevervationStatus(id);
    if (!reservationStatus.isValid) {
      throw new BadRequestException(reservationStatus.error);
    }
    return this.reservationsService.use(id);
  }

  @ApiOperation({ summary: 'Get reservation qr info' })
  @ApiOkResponse({ description: 'The reservation qr info has been successfully retrieved.' })
  @ApiNotFoundResponse({ description: 'Reservation not found.' })
  @Get(':id/qr-info')
  @ApiParam({ name: 'id', description: 'Reservation Id' })
  async getQrInfo(@Param('id') id: string) {
    return this.reservationsService.getQrInfo(id);
  }

  @Get('xml-twiml')
  async serveXmlTwiml() {
    const resp = `
    <Response>
    <Play>http://demo.twilio.com/docs/classic.mp3</Play>
    </Response>
    `;
    return resp;
  }
}
