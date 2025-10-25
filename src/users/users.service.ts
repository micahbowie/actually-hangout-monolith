import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserMood } from './entities/user.entity';
import { ClerkUserData } from './types/clerk-webhook.types';
import { phone } from 'phone';
import { v4 as uuidv4 } from 'uuid';
import * as crypto from 'crypto';

type UpdateUserData = {
  firstName?: string;
  lastName?: string;
  email?: string | null;
  profileImageUrl?: string;
  lastActiveAt?: number;
  lastSignInAt?: number;
  mood?: string;
  username?: string | null;
  birthday?: string;
};

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Generate a deterministic numeric user ID from a phone number
   */
  private generateUserId(phoneNumber: string): number {
    // Create hash and convert to integer
    const hash = crypto.createHash('sha256').update(phoneNumber).digest('hex');
    // Take first 8 characters of hash and convert to integer
    const numericId = parseInt(hash.substring(0, 8), 16);
    return numericId;
  }

  /**
   * Create a new user from Clerk webhook data
   */
  async createUser(data: ClerkUserData): Promise<User> {
    this.logger.log({
      message: 'Creating user from Clerk data',
      clerkId: data.id,
    });

    // Find primary phone number
    const primaryPhone = data.phone_numbers.find(
      (phone) => phone.id === data.primary_phone_number_id,
    )?.phone_number;

    if (!primaryPhone) {
      throw new Error('Primary phone number not found');
    }

    // Validate phone number
    const sanitizedPhone = phone(primaryPhone, { country: 'US' });
    if (!sanitizedPhone.isValid) {
      throw new Error('Invalid phone number');
    }

    // Find primary email
    const primaryEmail =
      data.email_addresses.find(
        (email) => email.id === data.primary_email_address_id,
      )?.email_address || null;

    // Generate deterministic ID from phone
    const userId = this.generateUserId(sanitizedPhone.phoneNumber);

    // Extract mood from unsafe metadata
    let mood = UserMood.ANTI_SOCIAL;
    if (data.unsafe_metadata?.mood) {
      const moodValue = data.unsafe_metadata.mood;
      if (Object.values(UserMood).includes(moodValue as UserMood)) {
        mood = moodValue as UserMood;
      }
    }

    // Create user entity
    const user = this.userRepository.create({
      id: userId, // Manually set deterministic ID
      uuid: uuidv4(), // Generate UUID for external_id in Clerk
      clerkId: data.id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: primaryEmail,
      phoneNumber: sanitizedPhone.phoneNumber,
      profileImageUrl: data.profile_image_url,
      username: data.username,
      birthday: data.birthday ? new Date(data.birthday) : null,
      createdAt: new Date(data.created_at * 1000),
      updatedAt: new Date(data.updated_at * 1000),
      lastSignInAt: data.last_sign_in_at
        ? new Date(data.last_sign_in_at * 1000)
        : new Date(),
      pushTokens: [],
      mood,
    });

    const savedUser = await this.userRepository.save(user);

    this.logger.log({
      message: 'User created successfully',
      userId: savedUser.id,
      clerkId: savedUser.clerkId,
    });

    return savedUser;
  }

  /**
   * Update a user by Clerk ID
   */
  async updateUser(
    clerkId: string,
    updates: UpdateUserData,
  ): Promise<User | null> {
    this.logger.log({
      message: 'Updating user',
      clerkId,
      updates,
    });

    const user = await this.userRepository.findOne({
      where: { clerkId },
    });

    if (!user) {
      this.logger.warn({
        message: 'User not found for update',
        clerkId,
      });
      return null;
    }

    // Map updates to entity fields
    if (updates.firstName !== undefined) {
      user.firstName = updates.firstName;
    }
    if (updates.lastName !== undefined) {
      user.lastName = updates.lastName;
    }
    if (updates.email !== undefined) {
      user.email = updates.email;
    }
    if (updates.profileImageUrl !== undefined) {
      user.profileImageUrl = updates.profileImageUrl;
    }
    if (updates.username !== undefined) {
      user.username = updates.username;
    }
    if (updates.birthday !== undefined) {
      user.birthday = new Date(updates.birthday);
    }
    if (updates.lastActiveAt !== undefined) {
      user.updatedAt = new Date(updates.lastActiveAt * 1000);
    }
    if (updates.lastSignInAt !== undefined) {
      user.lastSignInAt = new Date(updates.lastSignInAt * 1000);
    }
    if (updates.mood !== undefined) {
      const moodValue = updates.mood;
      if (Object.values(UserMood).includes(moodValue as UserMood)) {
        user.mood = moodValue as UserMood;
      }
    }

    const savedUser = await this.userRepository.save(user);

    this.logger.log({
      message: 'User updated successfully',
      userId: savedUser.id,
      clerkId: savedUser.clerkId,
    });

    return savedUser;
  }

  /**
   * Delete a user by Clerk ID (hard delete)
   */
  async deleteUser(clerkId: string): Promise<void> {
    this.logger.log({
      message: 'Deleting user',
      clerkId,
    });

    const user = await this.userRepository.findOne({
      where: { clerkId },
    });

    if (!user) {
      throw new NotFoundException(`User with Clerk ID ${clerkId} not found`);
    }

    await this.userRepository.remove(user);

    this.logger.log({
      message: 'User deleted successfully',
      clerkId,
    });
  }

  /**
   * Find a user by Clerk ID
   */
  async getUserByClerkId(clerkId: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { clerkId },
    });
  }

  /**
   * Find a user by UUID
   */
  async getUserByUuid(uuid: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { uuid },
    });
  }
}
