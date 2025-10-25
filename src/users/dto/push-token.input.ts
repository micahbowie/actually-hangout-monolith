import { Field, InputType } from '@nestjs/graphql';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';

@InputType()
export class PushTokenInput {
  @Field(() => String, {
    description: 'The push notification token from the device',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(10, { message: 'Push token must be at least 10 characters long' })
  token: string;
}
