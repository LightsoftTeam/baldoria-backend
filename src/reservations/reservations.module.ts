import { Module, forwardRef } from '@nestjs/common';
import { ReservationsService } from './reservations.service';
import { ReservationsController } from './reservations.controller';
import { Reservation } from './entities/reservation.entity';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { UsersModule } from 'src/users/users.module';

@Module({
  controllers: [ReservationsController],
  providers: [ReservationsService],
  imports: [
    AzureCosmosDbModule.forFeature([{ dto: Reservation }]),
    forwardRef(() => UsersModule)
  ],
  exports: [ReservationsService]
})
export class ReservationsModule {}
