import {
  Controller,
  Post,
  Body,
  UseGuards,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhookVerificationGuard } from './guards/webhook-verification.guard';
import type { ClerkWebhookEvent } from '../users/types/clerk-webhook.types';

@Controller('webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(private readonly webhooksService: WebhooksService) {}

  @Post('clerk')
  @HttpCode(HttpStatus.OK)
  @UseGuards(WebhookVerificationGuard)
  handleClerkWebhook(@Body() event: ClerkWebhookEvent): void {
    this.logger.log({
      message: 'Received Clerk webhook',
      eventType: event.type,
    });

    try {
      this.webhooksService.handleWebhook(event);

      this.logger.log({
        message: 'Clerk webhook processed successfully',
        eventType: event.type,
      });
    } catch (error) {
      this.logger.error({
        message: 'Error processing Clerk webhook',
        eventType: event.type,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }
}
