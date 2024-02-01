import { ApiProperty } from "@nestjs/swagger";
import { IsString } from "class-validator";
import { DocumentType } from "../entities/user.entity";

export class GetClientDto {
    @ApiProperty({
        description: 'The type of document',
        enum: DocumentType,
        example: DocumentType.DNI
    })
    @IsString()
    documentType: string;

    @ApiProperty({
        description: 'The number of the document',
        example: '76767676'
    })
    @IsString()
    documentNumber: string;
}
