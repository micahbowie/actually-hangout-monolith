import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HangoutsService } from './hangouts.service';
import { HangoutsResolver } from './hangouts.resolver';
import { Hangout } from './entities/hangout.entity';
import { Suggestion } from './entities/suggestion.entity';
import { HangoutCollaborator } from './entities/hangout-collaborator.entity';
import { Invitation } from './entities/invitation.entity';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Hangout,
      Suggestion,
      HangoutCollaborator,
      Invitation,
    ]),
    UsersModule,
  ],
  providers: [HangoutsService, HangoutsResolver],
  exports: [HangoutsService],
})
export class HangoutsModule {}
