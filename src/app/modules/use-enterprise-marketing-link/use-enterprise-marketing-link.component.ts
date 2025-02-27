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
  protected readonly targetUrl = 'https://truenas.com/explore-truenas-enterprise/';

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
    const lastMessageHash = localStorage.getItem('marketingMessageLastHash');

    if (lastShownDate !== today) {
      const nextMessage = this.getNextMessage(lastMessageHash);

      localStorage.setItem('marketingMessageLastShownDate', today);
      localStorage.setItem('marketingMessageLastHash', this.hashMessage(nextMessage));

      return nextMessage + ' 🔥';
    }

    return this.getCurrentMessage(lastMessageHash) + ' 🔥';
  }

  getNextMessage(lastMessageHash: string | null): string {
    const lastIndex = this.messages.findIndex((message) => this.hashMessage(message) === lastMessageHash);
    const nextIndex = lastIndex >= 0 ? (lastIndex + 1) % this.messages.length : 0;
    return this.messages[nextIndex];
  }

  getCurrentMessage(lastMessageHash: string | null): string {
    const currentIndex = this.messages.findIndex((message) => this.hashMessage(message) === lastMessageHash);
    return currentIndex >= 0 ? this.messages[currentIndex] : this.messages[0];
  }

  hashMessage(message: string): string {
    return btoa(encodeURIComponent(message));
  }

  trackClick(message: string): void {
    const trackedUrl = `${this.targetUrl}?m=${this.hashMessage(message)}`;
    this.window.open(trackedUrl, '_blank');
  }
}
