import { ApiProperty } from "@nestjs/swagger";
import { IsEnum, IsOptional, IsString } from "class-validator";
import { Sort } from "src/common/interfaces/sort.enum";

export enum SortBy {
    FIRST_NAME = 'firstName',
    EMAIL = 'email',
    CREATED_AT = 'createdAt'
}

export class GetUsersDto {
    @ApiProperty({
        description: 'Page number',
        example: 1,
        default: 1
    })
    @IsString()
    @IsOptional()
    page: string;

    @ApiProperty({
        description: 'Limit',
        example: 10,
        default: 10
    })
    @IsString()
    @IsOptional()
    limit: string;

    @ApiProperty({
        description: 'Search',
        example: 'John',
        default: ''
    })
    @IsString()
    @IsOptional()
    search: string;

    @ApiProperty({
        description: 'Sort',
        example: 'asc',
        default: 'asc'
    })
    @IsEnum(SortBy)
    @IsOptional()
    sortBy: SortBy;

    @ApiProperty({
        description: 'Sort by',
        example: 'name',
        default: 'name'
    })
    @IsEnum(Sort)
    @IsOptional()
    sort: string;
}
