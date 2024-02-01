import { IsEmail, IsEnum, IsNotEmpty, IsString } from "class-validator";
import { DocumentType } from "../entities/user.entity";
import { ApiProperty } from "@nestjs/swagger";

export class CreateUserDto {
    @ApiProperty({
        example: 'John',
    })
    @IsString()
    @IsNotEmpty()
    firstName: string;

    @ApiProperty({
        example: 'Doe',
    })
    @IsString()
    @IsNotEmpty()
    lastName: string;

    @ApiProperty({
        enum: DocumentType,
        example: DocumentType.DNI,
        description: 'Document type of client',
    })
    @IsEnum(DocumentType)
    @IsNotEmpty()
    documentType: DocumentType;

    @ApiProperty({
        example: '12345678',
    })
    @IsString()
    @IsNotEmpty()
    documentNumber: string;

    @ApiProperty({
        example: 'test@test.com',
    })
    @IsEmail()
    @IsNotEmpty()
    email: string;

    // @ApiProperty({
    //     example: '123456',
    // })
    // @IsString()
    // @IsNotEmpty()
    // password: string;

    @ApiProperty({
        example: '+51',
    })
    @IsString()
    @IsNotEmpty()
    phoneCode: string;

    @ApiProperty({
        example: '123456789',
    })
    @IsString()
    @IsNotEmpty()
    phoneNumber: string;

    @ApiProperty({
        example: '1990-01-01',
    })
    @IsString()
    @IsNotEmpty()
    birthdate: string;
}
