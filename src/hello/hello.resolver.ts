import { Query, Resolver } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { Hello } from './models/hello.model';
import { ClerkAuthGuard } from '../auth/clerk-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

interface AuthObject {
  userId: string;
  sessionId?: string;
  orgId?: string;
}

@Resolver(() => Hello)
export class HelloResolver {
  @Query(() => Hello, { name: 'hello' })
  getHello(): Hello {
    return {
      message: 'Hello World!',
    };
  }

  @Query(() => Hello, { name: 'helloAuth' })
  @UseGuards(ClerkAuthGuard)
  getHelloAuth(@CurrentUser() auth: AuthObject): Hello {
    return {
      message: `Hello authenticated user! Your user ID is: ${auth.userId}`,
    };
  }
}
