import { Query, Resolver } from '@nestjs/graphql';
import { Hello } from './models/hello.model';

@Resolver(() => Hello)
export class HelloResolver {
  @Query(() => Hello, { name: 'hello' })
  getHello(): Hello {
    return {
      message: 'Hello World!',
    };
  }
}
