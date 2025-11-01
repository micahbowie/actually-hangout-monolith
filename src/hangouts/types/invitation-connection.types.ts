import { ObjectType, Field } from '@nestjs/graphql';
import { Invitation } from '../entities/invitation.entity';
import { PageInfo } from './common-connection.types';

@ObjectType()
export class InvitationEdge {
  @Field(() => Invitation)
  node: Invitation;

  @Field(() => String)
  cursor: string;
}

@ObjectType()
export class InvitationConnection {
  @Field(() => [InvitationEdge])
  edges: InvitationEdge[];

  @Field(() => PageInfo)
  pageInfo: PageInfo;

  @Field(() => Number)
  totalCount: number;
}
