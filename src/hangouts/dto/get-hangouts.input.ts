import { InputType, Field, ObjectType } from '@nestjs/graphql';
import {
  IsOptional,
  IsString,
  IsBoolean,
  IsInt,
  Min,
  IsEnum,
  IsISO8601,
} from 'class-validator';
import { HangoutStatus } from '../entities/hangout.entity';
import { Hangout } from '../entities/hangout.entity';

@InputType()
export class GetHangoutsInput {
  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  search?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601()
  startDate?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsISO8601()
  endDate?: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  collaborationMode?: boolean;

  @Field(() => HangoutStatus, { nullable: true })
  @IsOptional()
  @IsEnum(HangoutStatus)
  status?: HangoutStatus;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  limit?: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  nextToken?: string;
}

@ObjectType()
export class HangoutsResponse {
  @Field(() => [Hangout])
  hangouts: Hangout[];

  @Field(() => String, { nullable: true })
  nextToken?: string;

  @Field(() => Number)
  total: number;
}
