import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsNotEmpty, IsString } from "class-validator";
import { Enterprise } from "src/users/entities/user.entity";

export class GetReservationsDto {
    @ApiProperty({
        example: '2024-03-01',
    })
    @IsString()
    @IsNotEmpty()
    date: string;

    @ApiProperty({
        example: 'enterprise',
        enum: Enterprise
    })
    @IsEnum(Enterprise)
    enterprise: Enterprise;
}
