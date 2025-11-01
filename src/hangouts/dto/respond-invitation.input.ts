import { InputType, Field } from '@nestjs/graphql';
import { IsInt, IsPositive, IsEnum } from 'class-validator';
import { InvitationStatus } from '../entities/invitation.entity';

@InputType()
export class RespondToInvitationInput {
  @Field(() => Number, {
    description: 'The ID of the invitation to respond to',
  })
  @IsInt()
  @IsPositive()
  invitationId: number;

  @Field(() => InvitationStatus, {
    description:
      'The response to the invitation (accepted, declined, or maybe)',
  })
  @IsEnum(InvitationStatus, {
    message: 'Status must be accepted, declined, or maybe',
  })
  status: InvitationStatus;
}
