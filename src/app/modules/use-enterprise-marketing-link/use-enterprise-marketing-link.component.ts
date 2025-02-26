import {
  Component, ChangeDetectionStrategy, computed,
  Inject,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { WINDOW } from 'app/helpers/window.helper';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-use-enterprise-marketing-link',
  templateUrl: './use-enterprise-marketing-link.component.html',
  styleUrls: ['./use-enterprise-marketing-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TestDirective,
  ],
})
export class UseEnterpriseMarketingLinkComponent {
  targetUrl = 'https://example.com/truenas-marketing';

  messages = [
    this.translate.instant('Bring TrueNAS to work'),
    this.translate.instant('Unlock Enterprise Power'),
    this.translate.instant('Maximize Uptime! Learn more'),
    this.translate.instant('Maximize Security! Learn more'),
    this.translate.instant('Ready for TrueNAS Enterprise?'),
    this.translate.instant('Need Ultimate Reliability?'),
    this.translate.instant('High Availability Awaits!'),
    this.translate.instant('Discover Mission Critical Solutions'),
  ];

  currentMessage = computed(() => this.getTodaysMessage());

  constructor(
    private translate: TranslateService,
    @Inject(WINDOW) private window: Window,
  ) {}

  getTodaysMessage(): string {
    const today = new Date().toDateString();
    const lastShownDate = localStorage.getItem('marketingMessageLastShownDate');
    const lastMessageHash = localStorage.getItem('marketingMessageLastMessageHash');

    const nextMessage = this.getNextMessage(lastMessageHash);

    if (lastShownDate !== today) {
      localStorage.setItem('marketingMessageLastShownDate', today);
      localStorage.setItem('marketingMessageLastMessageHash', this.hashMessage(nextMessage));
    }

    return nextMessage + ' 🔥';
  }

  getNextMessage(lastMessageHash: string | null): string {
    // Find index using the hash
    const lastIndex = this.messages.findIndex((message) => this.hashMessage(message) === lastMessageHash);

    // Rotate to the next message, or start from the first if not found
    const nextIndex = lastIndex >= 0 ? (lastIndex + 1) % this.messages.length : 0;
    return this.messages[nextIndex];
  }

  hashMessage(message: string): string {
    return btoa(encodeURIComponent(message));
  }

  trackClick(message: string): void {
    const trackedUrl = `${this.targetUrl}?utm_source=truenas&utm_medium=widget&utm_campaign=${encodeURIComponent(message)}`;
    this.window.open(trackedUrl, '_blank');
  }
}
