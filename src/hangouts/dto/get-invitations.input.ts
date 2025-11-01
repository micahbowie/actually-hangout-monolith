import { InputType, Field } from '@nestjs/graphql';
import { IsInt, IsPositive, IsOptional, IsEnum } from 'class-validator';
import { InvitationStatus } from '../entities/invitation.entity';

@InputType()
export class GetInvitationsInput {
  @Field(() => Number, {
    nullable: true,
    description: 'Filter by hangout ID',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  hangoutId?: number;

  @Field(() => Number, {
    nullable: true,
    description: 'Filter by invitee user ID',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  inviteeId?: number;

  @Field(() => InvitationStatus, {
    nullable: true,
    description: 'Filter by invitation status',
  })
  @IsOptional()
  @IsEnum(InvitationStatus)
  status?: InvitationStatus;

  @Field(() => Number, {
    nullable: true,
    defaultValue: 20,
    description: 'Number of results to return (max 100)',
  })
  @IsOptional()
  @IsInt()
  @IsPositive()
  first?: number;

  @Field(() => String, {
    nullable: true,
    description: 'Cursor for pagination',
  })
  @IsOptional()
  after?: string;
}
