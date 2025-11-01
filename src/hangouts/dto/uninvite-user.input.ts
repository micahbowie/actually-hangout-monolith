import { InputType, Field } from '@nestjs/graphql';
import { IsInt, IsPositive } from 'class-validator';

@InputType()
export class UninviteUserInput {
  @Field(() => Number, {
    description: 'The ID of the hangout to remove the invitation from',
  })
  @IsInt()
  @IsPositive()
  hangoutId: number;

  @Field(() => Number, {
    description: 'The user ID of the person to uninvite',
  })
  @IsInt()
  @IsPositive()
  inviteeId: number;
}
