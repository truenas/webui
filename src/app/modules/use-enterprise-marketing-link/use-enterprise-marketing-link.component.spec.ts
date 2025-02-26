import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { WINDOW } from 'app/helpers/window.helper';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { UseEnterpriseMarketingLinkComponent } from './use-enterprise-marketing-link.component';

const lastShownDate = 'marketingMessageLastShownDate';
const lastMessageHash = 'marketingMessageLastMessageHash';

describe('UseEnterpriseMarketingLinkComponent', () => {
  let spectator: Spectator<UseEnterpriseMarketingLinkComponent>;
  let windowSpy: jest.SpyInstance;
  const mockWindow = { open: jest.fn() };

  const createComponent = createComponentFactory({
    component: UseEnterpriseMarketingLinkComponent,
    imports: [
      TestDirective,
    ],
    providers: [
      {
        provide: WINDOW,
        useValue: mockWindow,
      },
      {
        provide: TranslateService,
        useValue: {
          instant: (key: string) => key,
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    windowSpy = jest.spyOn(mockWindow, 'open');
    jest.spyOn(global.Date.prototype, 'toDateString').mockReturnValue('2025-02-26');

    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should display the first message by default', () => {
    const message = spectator.component.currentMessage();
    expect(message).toBe('Bring TrueNAS to work 🔥');
  });

  it('should rotate to the next message on a new day', () => {
    localStorage.setItem(lastShownDate, '2025-02-25');
    localStorage.setItem(lastMessageHash, spectator.component.hashMessage('Bring TrueNAS to work'));

    const nextMessage = spectator.component.getTodaysMessage();
    expect(nextMessage).toBe('Unlock Enterprise Power 🔥');
  });

  it('should loop to the first message after the last message', () => {
    localStorage.setItem(lastShownDate, '2025-02-25');
    localStorage.setItem(lastMessageHash, spectator.component.hashMessage('Discover Mission Critical Solutions'));

    const nextMessage = spectator.component.getTodaysMessage();
    expect(nextMessage).toBe('Bring TrueNAS to work 🔥');
  });

  it('should update localStorage with new date and hash', () => {
    spectator.component.getTodaysMessage();

    expect(localStorage.getItem(lastShownDate)).toBe('2025-02-26');
    expect(localStorage.getItem(lastMessageHash)).toBe(spectator.component.hashMessage('Bring TrueNAS to work'));
  });

  it('should track click with correct URL', () => {
    const message = 'Bring TrueNAS to work';
    spectator.component.trackClick(message);

    expect(windowSpy).toHaveBeenCalledWith(
      'https://example.com/truenas-marketing?utm_source=truenas&utm_medium=widget&utm_campaign=Bring%20TrueNAS%20to%20work',
      '_blank',
    );
  });

  it('should maintain consistent message even if array order changes', () => {
    const originalHash = spectator.component.hashMessage('Maximize Uptime! Learn more');
    localStorage.setItem('marketingMessageLastShownDate', '2025-02-25');
    localStorage.setItem('marketingMessageLastMessageHash', originalHash);

    spectator.component.messages = [
      'Maximize Uptime! Learn more',
      'Bring TrueNAS to work',
      'Unlock Enterprise Power',
    ];

    const nextMessage = spectator.component.getTodaysMessage();
    expect(nextMessage).toBe('Bring TrueNAS to work 🔥');
  });
});
