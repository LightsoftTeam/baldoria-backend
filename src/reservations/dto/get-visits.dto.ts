import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GetVisitsDto {
    @ApiProperty({
        example: '2024-03-01',
    })
    @IsString()
    @IsNotEmpty()
    from: string;
    @ApiProperty({
        example: '2024-03-01',
    })
    @IsString()
    @IsNotEmpty()
    to: string;
}
