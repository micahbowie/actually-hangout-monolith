import { InputType, Field } from '@nestjs/graphql';
import { IsInt, IsPositive, IsEnum, IsOptional } from 'class-validator';
import { CollaboratorRole } from '../entities/hangout-collaborator.entity';

@InputType()
export class AddCollaboratorInput {
  @Field(() => Number, {
    description: 'The ID of the hangout to add a collaborator to',
  })
  @IsInt()
  @IsPositive()
  hangoutId: number;

  @Field(() => Number, {
    description: 'The user ID of the collaborator to add',
  })
  @IsInt()
  @IsPositive()
  userId: number;

  @Field(() => CollaboratorRole, {
    nullable: true,
    defaultValue: CollaboratorRole.COLLABORATOR,
    description: 'The role to assign to the collaborator',
  })
  @IsOptional()
  @IsEnum(CollaboratorRole)
  role?: CollaboratorRole;
}
