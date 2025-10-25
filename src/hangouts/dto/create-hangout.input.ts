import { InputType, Field } from '@nestjs/graphql';
import {
  IsString,
  IsNotEmpty,
  IsBoolean,
  IsOptional,
  ValidateNested,
  IsEnum,
  IsInt,
  IsPositive,
  Max,
  Min,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import { HangoutVisibility } from '../entities/hangout.entity';
import { HangoutAvailabilityType } from '../entities/suggestion.entity';

@InputType()
export class HangoutLocationCoordinatesInput {
  @Field(() => Number, { nullable: true })
  @IsOptional()
  @Min(-90, { message: 'Latitude must be between -90 and 90' })
  @Max(90, { message: 'Latitude must be between -90 and 90' })
  latitude?: number;

  @Field(() => Number, { nullable: true })
  @IsOptional()
  @Min(-180, { message: 'Longitude must be between -180 and 180' })
  @Max(180, { message: 'Longitude must be between -180 and 180' })
  longitude?: number;
}

@InputType()
export class HangoutLocationDetailsInput {
  @Field(() => HangoutLocationCoordinatesInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => HangoutLocationCoordinatesInput)
  coordinates?: HangoutLocationCoordinatesInput;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  fullAddress?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  placedFormatted?: string;
}

@InputType()
export class GroupDecisionVotingSettingsInput {
  @Field(() => Boolean)
  @IsBoolean()
  anonymousVotes: boolean;

  @Field(() => Boolean)
  @IsBoolean()
  anonymousSuggestions: boolean;

  @Field(() => Number)
  @IsInt({ message: 'Votes per person must be an integer' })
  @IsPositive({ message: 'Votes per person must be positive' })
  @Max(10, { message: 'Votes per person cannot exceed 10' })
  votesPerPerson: number;

  @Field(() => Number)
  @IsInt({ message: 'Options per person must be an integer' })
  @IsPositive({ message: 'Options per person must be positive' })
  @Max(10, { message: 'Options per person cannot exceed 10' })
  optionsPerPerson: number;
}

@InputType()
export class GroupDecisionSuggestionSettingsInput {
  @Field(() => Boolean)
  @IsBoolean()
  location: boolean;

  @Field(() => Boolean)
  @IsBoolean()
  activity: boolean;

  @Field(() => Boolean)
  @IsBoolean()
  dateTime: boolean;
}

@InputType()
export class GroupDecisionDeadlinesInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  suggestion: string;

  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  voting: string;
}

@InputType()
export class GroupDecisionNotificationSettingsInput {
  @Field(() => Boolean)
  @IsBoolean()
  newSuggestions: boolean;

  @Field(() => Boolean)
  @IsBoolean()
  votingUpdates: boolean;

  @Field(() => Boolean)
  @IsBoolean()
  deadlineReminders: boolean;
}

@InputType()
export class GroupDecisionInput {
  @Field(() => GroupDecisionVotingSettingsInput)
  @ValidateNested()
  @Type(() => GroupDecisionVotingSettingsInput)
  voting: GroupDecisionVotingSettingsInput;

  @Field(() => GroupDecisionSuggestionSettingsInput)
  @ValidateNested()
  @Type(() => GroupDecisionSuggestionSettingsInput)
  openForSuggestions: GroupDecisionSuggestionSettingsInput;

  @Field(() => GroupDecisionDeadlinesInput)
  @ValidateNested()
  @Type(() => GroupDecisionDeadlinesInput)
  deadlines: GroupDecisionDeadlinesInput;

  @Field(() => GroupDecisionNotificationSettingsInput)
  @ValidateNested()
  @Type(() => GroupDecisionNotificationSettingsInput)
  notifications: GroupDecisionNotificationSettingsInput;
}

@InputType()
export class LocationSuggestionInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  location: string;

  @Field(() => HangoutLocationDetailsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => HangoutLocationDetailsInput)
  locationDetails?: HangoutLocationDetailsInput;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  note?: string;
}

@InputType()
export class ActivitySuggestionInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  activity: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  note?: string;
}

@InputType()
export class DateTimeSuggestionInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  dateTime: string;

  @Field(() => HangoutAvailabilityType)
  @IsEnum(HangoutAvailabilityType)
  availabilityType: HangoutAvailabilityType;
}

@InputType()
export class GroupDecisionSuggestionsInput {
  @Field(() => [LocationSuggestionInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => LocationSuggestionInput)
  locations?: LocationSuggestionInput[];

  @Field(() => [ActivitySuggestionInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => ActivitySuggestionInput)
  activities?: ActivitySuggestionInput[];

  @Field(() => [DateTimeSuggestionInput], { nullable: true })
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => DateTimeSuggestionInput)
  dateTimes?: DateTimeSuggestionInput[];
}

@InputType()
export class CreateHangoutInput {
  @Field(() => String)
  @IsString()
  @IsNotEmpty()
  @MaxLength(255, { message: 'Title cannot exceed 255 characters' })
  title: string;

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

  @Field(() => HangoutVisibility)
  @IsEnum(HangoutVisibility)
  visibility: HangoutVisibility;

  @Field(() => Boolean)
  @IsBoolean()
  collaborationMode: boolean;

  @Field(() => GroupDecisionInput, { nullable: true })
  @ValidateIf((o: CreateHangoutInput) => o.collaborationMode === true)
  @IsNotEmpty({
    message:
      'Group decision settings are required when collaboration mode is enabled',
  })
  @ValidateNested()
  @Type(() => GroupDecisionInput)
  groupDecision?: GroupDecisionInput;

  @Field(() => GroupDecisionSuggestionsInput, { nullable: true })
  @IsOptional()
  @ValidateNested()
  @Type(() => GroupDecisionSuggestionsInput)
  groupDecisionSuggestions?: GroupDecisionSuggestionsInput;
}
