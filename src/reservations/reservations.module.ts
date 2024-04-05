import { Module } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { UsersModule } from 'src/users/users.module';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [ReservationsController],
  providers: [ReservationsService],
  imports: [
    UsersModule,
    CommonModule
  ],
  exports: [ReservationsService]
})
export class ReservationsModule {}
