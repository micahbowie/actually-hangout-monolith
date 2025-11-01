import { InputType, Field } from '@nestjs/graphql';
import {
  IsInt,
  IsPositive,
  IsString,
  IsOptional,
  MaxLength,
} from 'class-validator';

@InputType()
export class InviteUserInput {
  @Field(() => Number, {
    description: 'The ID of the hangout to invite the user to',
  })
  @IsInt()
  @IsPositive()
  hangoutId: number;

  @Field(() => Number, {
    description: 'The user ID of the person to invite',
  })
  @IsInt()
  @IsPositive()
  inviteeId: number;

  @Field(() => String, {
    nullable: true,
    description: 'Optional message to include with the invitation',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500, {
    message: 'Invitation message cannot exceed 500 characters',
  })
  message?: string;
}
