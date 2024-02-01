import { CosmosDateTime, CosmosPartitionKey } from '@nestjs/azure-database';

export enum DocumentType {
    DNI = 'dni',
    PASSPORT = 'passport',
}

export enum Role {
    ADMIN = 'admin',
    CLIENT = 'client',
}

@CosmosPartitionKey('id')
export class User {
    id?: string;
    firstName: string;
    lastName: string;
    documentType: DocumentType;
    documentNumber: string;
    email: string;
    password?: string;
    phoneCode: string;
    phoneNumber: string;
    role: Role;
    @CosmosDateTime() birthdate: Date;
    @CosmosDateTime() createdAt: Date;
}