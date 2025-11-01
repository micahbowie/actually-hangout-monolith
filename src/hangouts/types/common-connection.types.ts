import { ObjectType, Field } from '@nestjs/graphql';

/**
 * PageInfo type for relay-style cursor pagination
 * Contains information about pagination state
 * Follows the GraphQL Cursor Connections Specification
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
