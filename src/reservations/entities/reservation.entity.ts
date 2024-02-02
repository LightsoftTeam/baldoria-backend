import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";

export enum Enterprise{
    BALDORIA = 'baldoria',
    LOV = 'lov',
}

@CosmosPartitionKey('id')
export class Reservation {
    id?: string;
    enterprise: Enterprise;
    needParking: boolean;
    userId: string; 
    @CosmosDateTime() usedAt?: Date;
    @CosmosDateTime() date: Date;
    @CosmosDateTime() createdAt: Date;
}
