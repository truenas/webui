import { Component, ChangeDetectionStrategy, computed, effect, inject } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { MarketingMessage, getMarketingMessages } from 'app/constants/marketing-messages.constant';
import { hashMessage } from 'app/helpers/hash-message';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';

const lastShownDateKey = 'marketingMessageLastShownDate';
const lastMessageHashKey = 'marketingMessageLastHash';

@Component({
  selector: 'ix-use-enterprise-marketing-link',
  templateUrl: './use-enterprise-marketing-link.component.html',
  styleUrls: ['./use-enterprise-marketing-link.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TestDirective,
    TranslateModule,
  ],
})
export class UseEnterpriseMarketingLinkComponent {
  private tnConnect = inject(TruenasConnectService);

  // Snapshot the rotation state once at construction so message selection stays a
  // pure computed. The pool can still change when TrueNAS Connect config resolves
  // asynchronously, but the "which slot to show today" decision is made against a
  // stable pointer rather than being re-read (and advanced) on every recompute.
  private readonly today = new Date().toDateString();
  private readonly isNewDay = localStorage.getItem(lastShownDateKey) !== this.today;
  private readonly storedMessageHash = localStorage.getItem(lastMessageHashKey);

  private messages = computed<MarketingMessage[]>(() => getMarketingMessages(this.tnConnect.config()));

  protected currentMessage = computed<MarketingMessage>(() => {
    const messages = this.messages();
    return this.isNewDay
      ? this.getNextMessage(messages, this.storedMessageHash)
      : this.getCurrentMessage(messages, this.storedMessageHash);
  });

  protected currentMessageHref = computed<string | null>(() => {
    const message = this.currentMessage();
    if (!message.href) {
      return null;
    }
    return `${message.href}?m=${hashMessage(message.text)}`;
  });

  constructor() {
    // Persist the day's selection as an explicit side-effect, keeping the computed
    // pure. Re-runs if the resolved config swaps the pool after first render.
    if (this.isNewDay) {
      effect(() => {
        const message = this.currentMessage();
        localStorage.setItem(lastShownDateKey, this.today);
        localStorage.setItem(lastMessageHashKey, hashMessage(message.text));
      });
    }
  }

  private getNextMessage(messages: MarketingMessage[], lastMessageHash: string | null): MarketingMessage {
    const lastIndex = messages.findIndex((message) => hashMessage(message.text) === lastMessageHash);
    const nextIndex = lastIndex >= 0 ? (lastIndex + 1) % messages.length : 0;
    return messages[nextIndex];
  }

  private getCurrentMessage(messages: MarketingMessage[], lastMessageHash: string | null): MarketingMessage {
    const currentIndex = messages.findIndex((message) => hashMessage(message.text) === lastMessageHash);
    return currentIndex >= 0 ? messages[currentIndex] : messages[0];
  }
}
