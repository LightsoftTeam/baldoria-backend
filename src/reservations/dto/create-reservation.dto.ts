import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, IsUUID, isBoolean } from "class-validator";
import { Enterprise } from "../entities/reservation.entity";

export class CreateReservationDto {
    @ApiProperty({
        example: Enterprise.BALDORIA,
    })
    @IsEnum(Enterprise)
    enterprise: Enterprise;

    @ApiProperty({
        example: false,
    })
    @IsBoolean()
    @IsOptional()
    needParking: boolean;

    @ApiProperty({
        example: "2021-10-10",
    })
    @IsString()
    @IsNotEmpty()
    date: string;

    @ApiProperty({
        example: "550e8400-e29b-41d4-a716-446655440000",
    })
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    userId: string;
}
