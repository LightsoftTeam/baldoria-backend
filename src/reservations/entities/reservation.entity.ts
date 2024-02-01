import { CosmosDateTime, CosmosPartitionKey } from "@nestjs/azure-database";

export enum Enterprise{
    BALDORIA = 'baldoria',
    LOV = 'lov',
}

@CosmosPartitionKey('id')
export class Reservation {
    id?: string;
    hash: string;
    enterprise: Enterprise;
    needParking: boolean;
    isUsed: boolean;
    userId: string;
    @CosmosDateTime() date: Date;
    @CosmosDateTime() createdAt: Date;
}
