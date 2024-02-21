import { Controller, Get, Post, Body, Patch, Param, Delete, Query, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { GetClientDto } from './dto/get-client.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { GetUsersDto } from './dto/get-users.dto';
import { AddReservationDto } from './dto/add-reservation.dto';
import { ApplicationLoggerService } from 'src/common/services/application-logger.service';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(
    private readonly userService: UsersService,
    private readonly logger: ApplicationLoggerService
    ) { }

  @ApiOperation({ summary: 'Create a user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    this.logger.log('create UserController');
    return this.userService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Get all clients' })
  @ApiResponse({
    status: 200,
    description: 'The clients have been successfully retrieved.',
  })
  @Get()
  async findAll(@Query() getUsersDto: GetUsersDto){
    const {data, ...rest} = await this.userService.findAll(getUsersDto);
    const formattedData = data.map(user => {
      delete user.password;
      return user;
    });
    return {
      data: formattedData,
      ...rest
    };
  }

  @ApiOperation({ summary: 'Get a client by document' })
  @ApiResponse({
    status: 200,
    description: 'The client has been successfully retrieved.',
  })
  @ApiResponse({
    status: 404,
    description: 'The client was not found.'
  })
  @Get('/by-document/:documentType/:documentNumber')
  async getClient(@Param() getClientDto: GetClientDto) {
    const client = await this.userService.getClient(getClientDto);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    delete client.password;
    return client;
  }

  @ApiOperation({ summary: 'Retrieve user reservations' })
  @ApiParam({ name: 'id', description: 'The user id', example: '2cac3618-484b-414c-82fd-9c15350aa27f' })
  @Get(':id/reservations')
  async getReservations(@Param('id') id: string){
    return this.userService.getReservationsByUserId(id);
  }

  @ApiOperation({ summary: 'Add a reservation to user' })
  @ApiResponse({
    status: 201,
    description: 'The reservation has been successfully added.',
  })
  @ApiResponse({
    status: 404,
    description: 'The user was not found.'
  })
  @ApiParam({ name: 'id', description: 'The user id' })
  @Post(':id/reservations')
  async addReservation(@Param('id') id: string, @Body() addReservationDto: AddReservationDto){
    return this.userService.addReservation(id, addReservationDto);
  }
}
