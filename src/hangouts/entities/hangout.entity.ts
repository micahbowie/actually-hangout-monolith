import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Suggestion } from './suggestion.entity';
import { HangoutCollaborator } from './hangout-collaborator.entity';

export enum HangoutVisibility {
  PUBLIC = 'public',
  PRIVATE = 'private',
  FRIENDS = 'friends',
}

export enum HangoutStatus {
  PENDING = 'pending',
  FINALIZED = 'finalized',
  CANCELLED = 'cancelled',
  COMPLETED = 'completed',
}

registerEnumType(HangoutVisibility, {
  name: 'HangoutVisibility',
});

registerEnumType(HangoutStatus, {
  name: 'HangoutStatus',
});

@ObjectType()
export class HangoutLocationCoordinates {
  @Field(() => Number, { nullable: true })
  latitude?: number;

  @Field(() => Number, { nullable: true })
  longitude?: number;
}

@ObjectType()
export class HangoutLocationDetails {
  @Field(() => HangoutLocationCoordinates)
  coordinates: HangoutLocationCoordinates;

  @Field(() => String, { nullable: true })
  fullAddress?: string;

  @Field(() => String, { nullable: true })
  placedFormatted?: string;
}

@ObjectType()
export class GroupDecisionVotingSettings {
  @Field(() => Boolean)
  anonymousVotes: boolean;

  @Field(() => Boolean)
  anonymousSuggestions: boolean;

  @Field(() => Number)
  votesPerPerson: number;

  @Field(() => Number)
  optionsPerPerson: number;
}

@ObjectType()
export class GroupDecisionSuggestionSettings {
  @Field(() => Boolean)
  location: boolean;

  @Field(() => Boolean)
  activity: boolean;

  @Field(() => Boolean)
  dateTime: boolean;
}

@ObjectType()
export class GroupDecisionDeadlines {
  @Field(() => String)
  suggestion: string;

  @Field(() => String)
  voting: string;
}

@ObjectType()
export class GroupDecisionNotificationSettings {
  @Field(() => Boolean)
  newSuggestions: boolean;

  @Field(() => Boolean)
  votingUpdates: boolean;

  @Field(() => Boolean)
  deadlineReminders: boolean;
}

@ObjectType()
export class GroupDecisionSettings {
  @Field(() => GroupDecisionVotingSettings)
  voting: GroupDecisionVotingSettings;

  @Field(() => GroupDecisionSuggestionSettings)
  openForSuggestions: GroupDecisionSuggestionSettings;

  @Field(() => GroupDecisionDeadlines)
  deadlines: GroupDecisionDeadlines;

  @Field(() => GroupDecisionNotificationSettings)
  notifications: GroupDecisionNotificationSettings;
}

@ObjectType()
@Entity('hangouts')
@Index(['userId', 'createdAt']) // Composite index for getHangouts default sorting
@Index(['userId', 'status']) // Composite index for filtering by user and status
@Index(['userId', 'collaborationMode']) // Composite index for filtering by collaboration mode
@Index(['userId', 'startDateTime']) // Composite index for date range filtering by user
@Index(['visibility', 'createdAt']) // Composite index for public hangout discovery
@Index(['visibility', 'startDateTime']) // Composite index for public hangout date filtering
export class Hangout {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column({ name: 'uuid', type: 'varchar', unique: true })
  @Index()
  uuid: string;

  @Field(() => String)
  @Column({ name: 'title', type: 'varchar', length: 255 })
  @Index() // Index for search performance
  title: string;

  @Field(() => String, { nullable: true })
  @Column({ name: 'description', type: 'text', nullable: true })
  @Index() // Index for search performance
  description: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'street1', type: 'varchar', length: 255, nullable: true })
  street1: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'street2', type: 'varchar', length: 255, nullable: true })
  street2: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'city', type: 'varchar', length: 255, nullable: true })
  city: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'state', type: 'varchar', length: 255, nullable: true })
  state: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'zip_code', type: 'varchar', length: 255, nullable: true })
  zipCode: string | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'country', type: 'varchar', length: 255, nullable: true })
  country: string | null;

  @Field(() => Number, { nullable: true })
  @Column({
    name: 'longitude',
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
  })
  longitude: number | null;

  @Field(() => Number, { nullable: true })
  @Column({
    name: 'latitude',
    type: 'decimal',
    precision: 11,
    scale: 8,
    nullable: true,
  })
  latitude: number | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'location_name', type: 'varchar', nullable: true })
  @Index() // Index for search performance
  locationName: string | null;

  @Field(() => HangoutVisibility)
  @Column({
    name: 'visibility',
    type: 'enum',
    enum: HangoutVisibility,
    default: HangoutVisibility.PUBLIC,
  })
  @Index()
  visibility: HangoutVisibility;

  @Field(() => HangoutStatus)
  @Column({
    name: 'status',
    type: 'enum',
    enum: HangoutStatus,
    default: HangoutStatus.PENDING,
  })
  @Index()
  status: HangoutStatus;

  @Field(() => Boolean)
  @Column({
    name: 'group_decision_anonymous_voting_enabled',
    type: 'boolean',
    default: false,
  })
  groupDecisionAnonymousVotingEnabled: boolean;

  @Field(() => Boolean)
  @Column({
    name: 'group_decision_anonymous_suggestions_enabled',
    type: 'boolean',
    default: false,
  })
  groupDecisionAnonymousSuggestionsEnabled: boolean;

  @Field(() => Number)
  @Column({
    name: 'group_decision_suggestions_per_person',
    type: 'integer',
    default: 1,
  })
  groupDecisionSuggestionsPerPerson: number;

  @Field(() => Number)
  @Column({
    name: 'group_decision_votes_per_person',
    type: 'integer',
    default: 1,
  })
  groupDecisionVotesPerPerson: number;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'group_decision_suggestion_deadline',
    type: 'timestamp',
    nullable: true,
  })
  groupDecisionSuggestionDeadline: Date | null;

  @Field(() => String, { nullable: true })
  @Column({
    name: 'group_decision_voting_deadline',
    type: 'timestamp',
    nullable: true,
  })
  groupDecisionVotingDeadline: Date | null;

  @Field(() => Boolean)
  @Column({ name: 'collaboration_mode', type: 'boolean', default: false })
  @Index()
  collaborationMode: boolean;

  @Field(() => String, { nullable: true })
  @Column({ name: 'start_date_time', type: 'timestamp', nullable: true })
  @Index()
  startDateTime: Date | null;

  @Field(() => String, { nullable: true })
  @Column({ name: 'end_date_time', type: 'timestamp', nullable: true })
  @Index()
  endDateTime: Date | null;

  @Field(() => String)
  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Field(() => ID)
  @Column({ name: 'user_id', type: 'integer' })
  @Index()
  userId: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @OneToMany(() => Suggestion, (suggestion) => suggestion.hangout)
  suggestions: Suggestion[];

  @OneToMany(() => HangoutCollaborator, (collaborator) => collaborator.hangout)
  collaborators: HangoutCollaborator[];

  // Virtual fields for GraphQL
  @Field(() => ID)
  get creator(): string {
    return this.userId.toString();
  }

  @Field(() => String)
  get createdBy(): string {
    return this.userId.toString();
  }

  @Field(() => String, { nullable: true })
  get location(): string | null {
    return this.locationName;
  }

  @Field(() => String, { nullable: true })
  get activity(): string | null {
    // Activity is stored in suggestions table, will be resolved separately
    return null;
  }

  @Field(() => String, { nullable: true })
  get date(): string | null {
    return this.startDateTime ? this.startDateTime.toISOString() : null;
  }

  @Field(() => HangoutLocationDetails, { nullable: true })
  get locationDetails(): HangoutLocationDetails | null {
    if (!this.latitude && !this.longitude) {
      return null;
    }

    return {
      coordinates: {
        latitude: this.latitude ? Number(this.latitude) : undefined,
        longitude: this.longitude ? Number(this.longitude) : undefined,
      },
      fullAddress:
        [
          this.street1,
          this.street2,
          this.city,
          this.state,
          this.zipCode,
          this.country,
        ]
          .filter(Boolean)
          .join(', ') || undefined,
      placedFormatted: this.locationName || undefined,
    };
  }

  @Field(() => GroupDecisionSettings, { nullable: true })
  get groupDecisionSettings(): GroupDecisionSettings | null {
    if (!this.collaborationMode) {
      return null;
    }

    return {
      voting: {
        anonymousVotes: this.groupDecisionAnonymousVotingEnabled,
        anonymousSuggestions: this.groupDecisionAnonymousSuggestionsEnabled,
        votesPerPerson: this.groupDecisionVotesPerPerson,
        optionsPerPerson: this.groupDecisionSuggestionsPerPerson,
      },
      openForSuggestions: {
        location: true, // Default to true, can be configured later
        activity: true,
        dateTime: true,
      },
      deadlines: {
        suggestion: this.groupDecisionSuggestionDeadline?.toISOString() || '',
        voting: this.groupDecisionVotingDeadline?.toISOString() || '',
      },
      notifications: {
        newSuggestions: true, // Default to true
        votingUpdates: true,
        deadlineReminders: true,
      },
    };
  }
}
