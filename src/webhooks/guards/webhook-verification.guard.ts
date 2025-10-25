import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Request } from 'express';
import { Webhook } from 'svix';

@Injectable()
export class WebhookVerificationGuard implements CanActivate {
  private readonly logger = new Logger(WebhookVerificationGuard.name);
  private readonly webhookSecret: string;

  constructor() {
    this.webhookSecret = process.env.CLERK_WEBHOOK_SIGNING_SECRET || '';

    if (!this.webhookSecret) {
      this.logger.warn(
        'CLERK_WEBHOOK_SIGNING_SECRET not configured. Webhook verification will fail.',
      );
    }
  }

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();

    // Extract Svix headers
    const svixId = request.headers['svix-id'] as string;
    const svixTimestamp = request.headers['svix-timestamp'] as string;
    const svixSignature = request.headers['svix-signature'] as string;

    if (!svixId || !svixTimestamp || !svixSignature) {
      this.logger.warn({
        message: 'Missing Svix headers for webhook verification',
        headers: {
          'svix-id': !!svixId,
          'svix-timestamp': !!svixTimestamp,
          'svix-signature': !!svixSignature,
        },
      });
      throw new UnauthorizedException('Missing webhook verification headers');
    }

    // Get raw body (must be preserved by body parser)
    const payload = JSON.stringify(request.body);

    try {
      const wh = new Webhook(this.webhookSecret);

      // Verify the webhook signature
      wh.verify(payload, {
        'svix-id': svixId,
        'svix-timestamp': svixTimestamp,
        'svix-signature': svixSignature,
      });

      this.logger.log({
        message: 'Webhook signature verified successfully',
        svixId,
      });

      return true;
    } catch (error) {
      this.logger.error({
        message: 'Webhook verification failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        svixId,
      });
      throw new UnauthorizedException('Invalid webhook signature');
    }
  }
}
