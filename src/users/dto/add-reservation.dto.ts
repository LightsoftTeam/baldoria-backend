import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString, Matches } from "class-validator";
import { Enterprise } from "../entities/user.entity";

export class AddReservationDto {
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
    @Matches(/^\d{4}-\d{2}-\d{2}$/)
    @IsNotEmpty()
    date: string;
}
