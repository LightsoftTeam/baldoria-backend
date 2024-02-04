import { Injectable } from '@nestjs/common';
import { UsersService } from 'src/users/users.service';
import { GetReservationsDto } from './dto/get-reservations.dto';
import { Reservation } from 'src/users/entities/user.entity';

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

  async findOne(id: string): Promise<Reservation | null> {
    const reservation = await this.userService.getReservationById(id);
    return reservation;
  }

  async use(id: string) {
    return this.userService.useReservation(id);
  }
}
