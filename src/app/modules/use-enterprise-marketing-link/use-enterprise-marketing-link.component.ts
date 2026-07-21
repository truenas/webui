import { Component, ChangeDetectionStrategy, computed, inject } from '@angular/core';
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

  private messages = computed<MarketingMessage[]>(() => getMarketingMessages(this.tnConnect.config()));

  protected currentMessage = computed<MarketingMessage>(() => this.getTodaysMessage(this.messages()));

  protected currentMessageHref = computed<string | null>(() => {
    const message = this.currentMessage();
    if (!message.href) {
      return null;
    }
    return `${message.href}?m=${hashMessage(message.text)}`;
  });

  private getTodaysMessage(messages: MarketingMessage[]): MarketingMessage {
    const today = new Date().toDateString();
    const lastShownDate = localStorage.getItem(lastShownDateKey);
    const lastMessageHash = localStorage.getItem(lastMessageHashKey);

    if (lastShownDate !== today) {
      const nextMessage = this.getNextMessage(messages, lastMessageHash);

      localStorage.setItem(lastShownDateKey, today);
      localStorage.setItem(lastMessageHashKey, hashMessage(nextMessage.text));

      return nextMessage;
    }

    return this.getCurrentMessage(messages, lastMessageHash);
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
