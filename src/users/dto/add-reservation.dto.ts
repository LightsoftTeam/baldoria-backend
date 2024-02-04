import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsEnum, IsNotEmpty, IsOptional, IsString } from "class-validator";
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
    @IsNotEmpty()
    date: string;
}
