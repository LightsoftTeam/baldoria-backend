import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { User } from './entities/user.entity';
import { ReservationsModule } from 'src/reservations/reservations.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    AzureCosmosDbModule.forFeature([{ dto: User }]),
    forwardRef(() => ReservationsModule)
  ],
  exports: [
    UsersService
  ]
})
export class UsersModule {}
