import { CosmosDateTime, CosmosPartitionKey } from '@nestjs/azure-database';

export enum DocumentType {
    DNI = 'dni',
    PASSPORT = 'pasaporte',
    CARNET_EXTRANJERIA = 'carnet_extranjeria'
}

export enum Role {
    ADMIN = 'admin',
    CLIENT = 'client',
}

export enum Enterprise{
    BALDORIA = 'baldoria',
    LOV = 'lov',
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
    reservations: Reservation[];
    lovCount: number;
    baldoriaCount: number;
    @CosmosDateTime() birthdate: Date;
    @CosmosDateTime() createdAt: Date;
}

export class Reservation {
    id: string;
    enterprise: Enterprise;
    needParking: boolean;
    @CosmosDateTime() usedAt?: Date;
    @CosmosDateTime() date: Date;
    @CosmosDateTime() createdAt: Date;
}