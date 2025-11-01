import { InputType, Field } from '@nestjs/graphql';
import { IsInt, IsPositive } from 'class-validator';

@InputType()
export class RemoveCollaboratorInput {
  @Field(() => Number, {
    description: 'The ID of the hangout to remove a collaborator from',
  })
  @IsInt()
  @IsPositive()
  hangoutId: number;

  @Field(() => Number, {
    description: 'The user ID of the collaborator to remove',
  })
  @IsInt()
  @IsPositive()
  userId: number;
}
