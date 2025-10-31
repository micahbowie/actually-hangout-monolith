import { ObjectType, Field, Int } from '@nestjs/graphql';
import { HangoutCollaborator } from '../entities/hangout-collaborator.entity';

/**
 * PageInfo type for relay-style cursor pagination
 * Contains information about pagination state
 */
@ObjectType()
export class PageInfo {
  @Field(() => Boolean, {
    description: 'Indicates if there are more items after this page',
  })
  hasNextPage: boolean;

  @Field(() => Boolean, {
    description: 'Indicates if there are more items before this page',
  })
  hasPreviousPage: boolean;

  @Field(() => String, {
    nullable: true,
    description: 'The cursor of the first item in the result set',
  })
  startCursor: string | null;

  @Field(() => String, {
    nullable: true,
    description: 'The cursor of the last item in the result set',
  })
  endCursor: string | null;
}

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
