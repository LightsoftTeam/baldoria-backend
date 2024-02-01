import { Controller, Get, Post, Body, Patch, Param, Delete, Query, NotFoundException } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetClientDto } from './dto/get-client.dto';
import { ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { DocumentType } from './entities/user.entity';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) { }

  @ApiOperation({ summary: 'Create a user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created.',
  })
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @ApiOperation({ summary: 'Get all clients' })
  @ApiResponse({
    status: 200,
    description: 'The clients have been successfully retrieved.',
  })
  @Get()
  async findAll() {
    const users = await this.userService.findAll();
    return users.map(user => {
      delete user.password;
      return user;
    });
  }

  @ApiOperation({ summary: 'Get a client' })
  @ApiResponse({
    status: 200,
    description: 'The client has been successfully retrieved.',
  })
  @ApiResponse({
    status: 404,
    description: 'The client was not found.'
  })
  @Get(':documentType/:documentNumber')
  async getClient(@Param() getClientDto: GetClientDto) {
    const client = await this.userService.getClient(getClientDto);
    if (!client) {
      throw new NotFoundException('Client not found');
    }
    delete client.password;
    return client;
  }
}
