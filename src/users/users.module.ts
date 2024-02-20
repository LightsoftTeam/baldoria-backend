import { Module, forwardRef } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { User } from './entities/user.entity';
import { CommonModule } from 'src/common/common.module';

@Module({
  controllers: [UsersController],
  providers: [UsersService],
  imports: [
    AzureCosmosDbModule.forFeature([{ dto: User }]),
    CommonModule
  ],
  exports: [
    UsersService,
  ]
})
export class UsersModule {}
