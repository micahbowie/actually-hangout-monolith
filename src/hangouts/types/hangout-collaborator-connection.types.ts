import { ObjectType, Field, Int } from '@nestjs/graphql';
import { HangoutCollaborator } from '../entities/hangout-collaborator.entity';
import { PageInfo } from './common-connection.types';

/**
 * Edge type containing a collaborator node and its cursor
 */
@ObjectType()
export class HangoutCollaboratorEdge {
  @Field(() => HangoutCollaborator, {
    description: 'The collaborator node',
  })
  node: HangoutCollaborator;

  @Field(() => String, {
    description: 'Opaque cursor for this collaborator',
  })
  cursor: string;
}

/**
 * Connection type for paginated collaborator results
 * Follows the GraphQL Cursor Connections Specification
 */
@ObjectType()
export class HangoutCollaboratorConnection {
  @Field(() => [HangoutCollaboratorEdge], {
    description: 'List of collaborator edges',
  })
  edges: HangoutCollaboratorEdge[];

  @Field(() => PageInfo, {
    description: 'Information about pagination',
  })
  pageInfo: PageInfo;

  @Field(() => Int, {
    description: 'Total count of collaborators',
  })
  totalCount: number;
}
