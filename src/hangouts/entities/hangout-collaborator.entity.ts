import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { ObjectType, Field, ID, registerEnumType } from '@nestjs/graphql';
import { User } from '../../users/entities/user.entity';
import { Hangout } from './hangout.entity';

export enum CollaboratorRole {
  ORGANIZER = 'organizer',
  COLLABORATOR = 'collaborator',
  VIEWER = 'viewer',
}

registerEnumType(CollaboratorRole, {
  name: 'CollaboratorRole',
  description: 'Role of a collaborator in a hangout',
});

@ObjectType()
@Entity('hangout_collaborators')
@Unique(['hangoutId', 'userId']) // Ensure a user can only be added once per hangout
@Index(['hangoutId', 'createdAt']) // For pagination when fetching collaborators
export class HangoutCollaborator {
  @Field(() => ID)
  @PrimaryGeneratedColumn()
  id: number;

  @Field(() => String)
  @Column({ name: 'uuid', type: 'varchar', unique: true })
  @Index()
  uuid: string;

  @Field(() => ID)
  @Column({ name: 'hangout_id', type: 'integer' })
  @Index()
  hangoutId: number;

  @Field(() => ID)
  @Column({ name: 'user_id', type: 'integer' })
  @Index()
  userId: number;

  @Field(() => CollaboratorRole)
  @Column({
    name: 'role',
    type: 'varchar',
    length: 50,
    default: CollaboratorRole.COLLABORATOR,
  })
  role: CollaboratorRole;

  @Field(() => String, { nullable: true })
  @Column({ name: 'invited_by', type: 'integer', nullable: true })
  invitedBy: number | null;

  @Field(() => String)
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @Field(() => String)
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @ManyToOne(() => Hangout, (hangout) => hangout.collaborators, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'hangout_id' })
  hangout: Hangout;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'user_id' })
  user: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'invited_by' })
  inviter: User | null;
}
