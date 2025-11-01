import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { Hangout } from './hangout.entity';
import { User } from '../../users/entities/user.entity';

export enum InvitationStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  DECLINED = 'declined',
  MAYBE = 'maybe',
}

registerEnumType(InvitationStatus, {
  name: 'InvitationStatus',
  description: 'The status of a hangout invitation',
});

@ObjectType()
@Entity('invitations')
@Index(['hangoutId', 'inviteeId'], { unique: true })
@Index(['inviteeId'])
@Index(['inviterId'])
@Index(['hangoutId'])
@Index(['status'])
@Index(['createdAt'])
export class Invitation {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column({ unique: true })
  @Index()
  uuid: string;

  @Field(() => Number)
  @Column({ name: 'hangout_id' })
  hangoutId: number;

  @Field(() => Hangout)
  @ManyToOne(() => Hangout)
  @JoinColumn({ name: 'hangout_id' })
  hangout: Hangout;

  @Field(() => Number)
  @Column({ name: 'invitee_id' })
  inviteeId: number;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'invitee_id' })
  invitee: User;

  @Field(() => Number)
  @Column({ name: 'inviter_id' })
  inviterId: number;

  @Field(() => User)
  @ManyToOne(() => User)
  @JoinColumn({ name: 'inviter_id' })
  inviter: User;

  @Field(() => InvitationStatus)
  @Column({
    type: 'enum',
    enum: InvitationStatus,
    default: InvitationStatus.PENDING,
  })
  status: InvitationStatus;

  @Field(() => String, { nullable: true })
  @Column({ type: 'text', nullable: true })
  message?: string;

  @Field(() => Date, { nullable: true })
  @Column({ name: 'responded_at', type: 'timestamp', nullable: true })
  respondedAt?: Date;

  @Field(() => Date)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => Date)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
