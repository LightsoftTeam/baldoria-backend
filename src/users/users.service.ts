import { Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/azure-database';
import type { Container } from '@azure/cosmos';
import { Role, User } from './entities/user.entity';
import { GetClientDto } from './dto/get-client.dto';
import { DateTime } from 'luxon'

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User)
    private readonly userContainer: Container
  ){}
  async create(createUserDto: CreateUserDto) {
    const user = {
      ...createUserDto,
      role: Role.CLIENT,
      //TODO: validate birthdate format YYYY-mm-dd
      birthdate: new Date(createUserDto.birthdate),
      createdAt: DateTime.local().minus({ hours: 5 }).toJSDate(),
    }
    const { resource } = await this.userContainer.items.create<User>(
      user
    );
    return resource;
  }

  async findAll() {
    const querySpec = {
      query: 'SELECT * FROM users where users.role = "client"',
    };
    const { resources } = await this.userContainer.items
    .query<User>(querySpec)
    .fetchAll();
  return resources;
  }

  async getClient(getClientDto: GetClientDto){
    const { documentType, documentNumber } = getClientDto;
    const querySpec = {
      query: 'SELECT * FROM c where c.role = "client" and c.documentType = @documentType and c.documentNumber = @documentNumber',
      parameters: [
        {
          name: '@documentType',
          value: documentType
        },
        {
          name: '@documentNumber',
          value: documentNumber
        }
      ]
    };
    const { resources } = await this.userContainer.items
    .query<User>(querySpec)
    .fetchAll();
    if(resources.length < 0){
      return null;
    }
    return resources[0];
  }

  async findOne(id: string) {
    // const {resource: user} = await this.userContainer.item(id).read<User>();
    // return user;
    const querySpec = {
      query: 'SELECT * FROM c where c.id = @id and c.role = "client"',
      parameters: [
        {
          name: '@id',
          value: id
        }
      ]
    };
    const { resources } = await this.userContainer.items
    .query<User>(querySpec)
    .fetchAll();
    if(resources.length === 0){
      throw new NotFoundException('User not found');
    }
    return resources[0];
  }

  async findByEmail(email: string) {
    const querySpec = {
    query: 'SELECT * FROM c where c.role = "admin" and c.email = @email',
      parameters: [
        {
          name: '@email',
          value: email
        }
      ]
    };
    const { resources } = await this.userContainer.items
    .query<User>(querySpec)
    .fetchAll();
    if(resources.length < 0){
      return null;
    }
    return resources[0];
  }

  update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  }

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
