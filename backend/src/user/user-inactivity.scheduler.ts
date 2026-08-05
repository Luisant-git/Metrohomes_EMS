
import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { UserService } from './user.service';

// Cron schedule is configurable via USER_INACTIVITY_CRON.
// Default: every day at 12:00 AM (server time) = "0 0 0 * * *".
const INACTIVITY_CRON: string = process.env.USER_INACTIVITY_CRON || '0 0 0 * * *';

@Injectable()
export class UserInactivityScheduler {
  private readonly logger = new Logger(UserInactivityScheduler.name);
  // Prevents overlapping runs (guards against a slow run drifting into the next tick).
  private isRunning = false;

  constructor(private readonly userService: UserService) {}

  @Cron(INACTIVITY_CRON, { name: 'user-inactivity-check' })
  async handleInactivityCheck(): Promise<void> {
    if (this.isRunning) {
      this.logger.warn('Inactivity check skipped: previous run still in progress');
      return;
    }

    this.isRunning = true;
    const startedAt = Date.now();
    try {
      const result = await this.userService.autoDeactivateInactiveUsers();
      this.logger.log(
        `Inactivity check completed in ${Date.now() - startedAt}ms — checked ${result.checked} user(s), ` +
        `deactivated ${result.deactivated}, reactivated ${result.reactivated}`,
      );
    } catch (error) {
      this.logger.error(
        `Inactivity check failed after ${Date.now() - startedAt}ms`,
        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isRunning = false;
    }
  }
}
