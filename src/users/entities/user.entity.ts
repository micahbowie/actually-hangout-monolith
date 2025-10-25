import { Entity, PrimaryColumn, Column, Index } from 'typeorm';

export enum UserMood {
  GOING_OUT = 'going_out',
  GOING_ONLINE = 'going_online',
  STAYING_IN = 'staying_in',
  ANTI_SOCIAL = 'anti_social',
}

@Entity('users')
export class User {
  @PrimaryColumn({ type: 'integer' })
  id: number;

  @Column({ name: 'uuid', type: 'varchar', unique: true })
  @Index()
  uuid: string;

  @Column({ name: 'clerk_id', type: 'varchar' })
  clerkId: string;

  @Column({ name: 'first_name', type: 'varchar' })
  firstName: string;

  @Column({ name: 'last_name', type: 'varchar' })
  lastName: string;

  @Column({ name: 'email', type: 'varchar', nullable: true })
  @Index()
  email: string | null;

  @Column({ name: 'phone_number', type: 'varchar', unique: true })
  @Index()
  phoneNumber: string;

  @Column({ name: 'profile_image_url', type: 'varchar', nullable: true })
  profileImageUrl: string | null;

  @Column({ name: 'banner_image_url', type: 'varchar', nullable: true })
  bannerImageUrl: string | null;

  @Column({ name: 'username', type: 'varchar', nullable: true })
  username: string | null;

  @Column({ name: 'birthday', type: 'timestamp', nullable: true })
  birthday: Date | null;

  @Column({ name: 'created_at', type: 'timestamp' })
  createdAt: Date;

  @Column({ name: 'updated_at', type: 'timestamp' })
  updatedAt: Date;

  @Column({ name: 'last_sign_in_at', type: 'timestamp' })
  lastSignInAt: Date;

  @Column({ name: 'push_tokens', type: 'jsonb', default: [] })
  pushTokens: string[];

  @Column({
    name: 'mood',
    type: 'enum',
    enum: UserMood,
    default: UserMood.ANTI_SOCIAL,
  })
  mood: UserMood;
}
