import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { User } from './entities/user.entity';
import { ConfigService, ConfigModule } from '@nestjs/config';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    AzureCosmosDbModule.forFeature([{ dto: User }]),
  ],
  exports: [
    UsersService
  ]
})
export class UsersModule {}
