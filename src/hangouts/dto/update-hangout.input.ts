import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  ValidateNested,
  IsEnum,
  IsInt,
  IsPositive,
  IsBoolean,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HangoutVisibility, HangoutStatus } from '../entities/hangout.entity';
import {
  HangoutLocationDetailsInput,
  GroupDecisionInput,
} from './create-hangout.input';

@InputType()
export class UpdateHangoutInput {
  @Field(() => Number)
  @IsInt()
  @IsPositive()
  id: number;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(5000, { message: 'Description cannot exceed 5000 characters' })
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Activity cannot exceed 255 characters' })
  activity?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255, { message: 'Location cannot exceed 255 characters' })
  location?: string;

  @Field(() => HangoutLocationDetailsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => HangoutLocationDetailsInput)
  locationDetails?: HangoutLocationDetailsInput;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  date?: string;

  @Field(() => HangoutVisibility, { nullable: true })
  @IsOptional()
  @IsEnum(HangoutVisibility)
  visibility?: HangoutVisibility;

  @Field(() => HangoutStatus, { nullable: true })
  @IsOptional()
  @IsEnum(HangoutStatus)
  status?: HangoutStatus;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  collaborationMode?: boolean;

  @Field(() => GroupDecisionInput, { nullable: true })
  @ValidateIf((o: UpdateHangoutInput) => o.collaborationMode === true)
  @IsOptional()
  @ValidateNested()
  @Type(() => GroupDecisionInput)
  groupDecision?: GroupDecisionInput;
}
