import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Hangout, HangoutLocationDetails } from './hangout.entity';

export enum SuggestionType {
  LOCATION = 'location',
  ACTIVITY = 'activity',
  TIME = 'time',
}

export enum SuggestionStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

export enum HangoutAvailabilityType {
  SPECIFIC = 'SPECIFIC',
  FLEXIBLE = 'FLEXIBLE',
  ALL_DAY = 'ALL_DAY',
}

registerEnumType(SuggestionType, {
  name: 'SuggestionType',
});

registerEnumType(SuggestionStatus, {
  name: 'SuggestionStatus',
});

registerEnumType(HangoutAvailabilityType, {
  name: 'HangoutAvailabilityType',
});

@ObjectType()
@Entity('suggestions')
export class Suggestion {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column({ name: 'uuid', type: 'varchar', unique: true })
  uuid: string;

  @Field(() => SuggestionType)
  @Column({
    name: 'suggestion_type',
    type: 'varchar',
    length: 20,
  })
  @Index()
  suggestionType: SuggestionType;

  @Field(() => SuggestionStatus)
  @Column({
    name: 'status',
    type: 'varchar',
    length: 20,
    default: SuggestionStatus.PENDING,
  })
  @Index()
  status: SuggestionStatus;

  // Location suggestion fields
  @Field(() => String, { nullable: true })
  @Column({
    name: 'location_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  locationName: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'location_address', type: 'text', nullable: true })
  locationAddress: string | null;

  @Field(() => Number, { nullable: true })
  @Column({
    name: 'location_latitude',
    type: 'decimal',
    precision: 10,
    scale: 8,
    nullable: true,
  })
  locationLatitude: number | null;

  @Field(() => Number, { nullable: true })
  @Column({
    name: 'location_longitude',
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
  })
  locationLongitude: number | null;

  // Activity suggestion fields
  @Field(() => String, { nullable: true })
  @Column({
    name: 'activity_name',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  activityName: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'activity_description', type: 'text', nullable: true })
  activityDescription: string | null;

  // Time suggestion fields
  @Field(() => String, { nullable: true })
  @Column({ name: 'suggested_date', type: 'date', nullable: true })
  suggestedDate: Date | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'suggested_start_time',
    type: 'timestamp with time zone',
    nullable: true,
  })
  suggestedStartTime: Date | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'suggested_end_time',
    type: 'timestamp with time zone',
    nullable: true,
  })
  suggestedEndTime: Date | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'suggested_timezone', type: 'varchar', nullable: true })
  suggestedTimezone: string | null;

  // Common fields
  @Field(() => String, { nullable: true })
  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string | null;

  @Field(() => String)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => ID)
  @Column({ name: 'user_id', type: 'integer' })
  @Index()
  userId: number;

  @Field(() => ID)
  @Column({ name: 'hangout_id', type: 'integer' })
  @Index()
  hangoutId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => Hangout, (hangout) => hangout.suggestions, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hangout_id' })
  hangout: Hangout;
}

// GraphQL types for group decision suggestions
@ObjectType()
export class LocationSuggestion {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  location: string;

  @Field(() => HangoutLocationDetails, { nullable: true })
  locationDetails?: HangoutLocationDetails;

  @Field(() => String, { nullable: true })
  note?: string;

  @Field(() => String)
  createdAt: string;

  @Field(() => String)
  updatedAt: string;

  @Field(() => ID)
  suggestedBy: string;
}

@ObjectType()
export class ActivitySuggestion {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  activity: string;

  @Field(() => String, { nullable: true })
  note?: string;

  @Field(() => String)
  createdAt: string;

  @Field(() => String)
  updatedAt: string;

  @Field(() => ID)
  suggestedBy: string;
}

@ObjectType()
export class DateTimeSuggestion {
  @Field(() => ID)
  id: string;

  @Field(() => String)
  dateTime: string;

  @Field(() => HangoutAvailabilityType)
  availabilityType: HangoutAvailabilityType;

  @Field(() => String)
  createdAt: string;

  @Field(() => String)
  updatedAt: string;

  @Field(() => ID)
  suggestedBy: string;
}

@ObjectType()
export class GroupDecisionSuggestions {
  @Field(() => [LocationSuggestion])
  locations: LocationSuggestion[];

  @Field(() => [ActivitySuggestion])
  activities: ActivitySuggestion[];

  @Field(() => [DateTimeSuggestion])
  dateTimes: DateTimeSuggestion[];
}
