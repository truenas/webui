import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TranslateService } from '@ngx-translate/core';
import { WINDOW } from 'app/helpers/window.helper';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { UseEnterpriseMarketingLinkComponent } from './use-enterprise-marketing-link.component';

const lastShownDate = 'marketingMessageLastShownDate';
const lastMessageHash = 'marketingMessageLastHash';

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
    expect(message).toBe('Optimize Your Storage');
  });

  it('should rotate to the next message on a new day', () => {
    localStorage.setItem(lastShownDate, '2025-02-25');
    localStorage.setItem(lastMessageHash, spectator.component.hashMessage('Optimize Your Storage'));

    const nextMessage = spectator.component.getTodaysMessage();
    expect(nextMessage).toBe('More Performance, More Protection');
  });

  it('should loop to the first message after the last message', () => {
    localStorage.setItem(lastShownDate, '2025-02-25');
    localStorage.setItem(lastMessageHash, spectator.component.hashMessage('Discover Mission Critical Solutions'));

    const nextMessage = spectator.component.getTodaysMessage();
    expect(nextMessage).toBe('Optimize Your Storage');
  });

  it('should update localStorage with new date and hash', () => {
    spectator.component.getTodaysMessage();

    expect(localStorage.getItem(lastShownDate)).toBe('2025-02-26');
    expect(localStorage.getItem(lastMessageHash)).toBe(spectator.component.hashMessage('Optimize Your Storage'));
  });

  it('should track click with correct URL', () => {
    const message = 'Optimize Your Storage';
    spectator.component.trackClick(message);

    expect(windowSpy).toHaveBeenCalledWith(
      'https://truenas.com/explore-truenas-enterprise/?m=T3B0aW1pemUlMjBZb3VyJTIwU3RvcmFnZQ==',
      '_blank',
    );
  });

  it('should maintain consistent message even if array order changes', () => {
    const originalHash = spectator.component.hashMessage('Boost Performance & Support');
    localStorage.setItem('marketingMessageLastShownDate', '2025-02-25');
    localStorage.setItem('marketingMessageLastHash', originalHash);

    spectator.component.messages = [
      'Boost Performance & Support',
      'Optimize Your Storage',
      'More Performance, More Protection',
    ];

    const nextMessage = spectator.component.getTodaysMessage();
    expect(nextMessage).toBe('Optimize Your Storage');
  });
});
