import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ApiTags } from '@nestjs/swagger';
import { ReservationsModule } from './reservations/reservations.module';
import { AzureCosmosDbModule } from '@nestjs/azure-database';
import { CommonModule } from './common/common.module';

@ApiTags('App')
@Module({
  imports: [
    ConfigModule.forRoot(),
    AuthModule, 
    UsersModule, 
    ReservationsModule,
    AzureCosmosDbModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        dbName: configService.get('DB_NAME'),
        endpoint: configService.get('DB_ENDPOINT'),
        key: configService.get('DB_KEY'),
        retryAttempts: 1,
      }),
      inject: [ConfigService],
    }),
    CommonModule,
  ]
})
export class AppModule {}
