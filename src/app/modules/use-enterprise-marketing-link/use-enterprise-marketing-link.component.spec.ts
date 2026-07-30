import { signal } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { exploreNasEnterpriseLink } from 'app/constants/explore-nas-enterprise-link.constant';
import { getMarketingMessages } from 'app/constants/marketing-messages.constant';
import { truenasConnectLink } from 'app/constants/truenas-connect-link.constant';
import { TruenasConnectStatus } from 'app/enums/truenas-connect-status.enum';
import { TruenasConnectTier } from 'app/enums/truenas-connect-tier.enum';
import { hashMessage } from 'app/helpers/hash-message';
import { TruenasConnectConfig } from 'app/interfaces/truenas-connect-config.interface';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { UseEnterpriseMarketingLinkComponent } from './use-enterprise-marketing-link.component';

const lastShownDate = 'marketingMessageLastShownDate';
const lastMessageHash = 'marketingMessageLastHash';

const firstEnterpriseMessage = 'More Performance, More Protection';
const lastPromoteTncMessage = 'Get email alerts and reports. Free forever.';

describe('getMarketingMessages', () => {
  it('promotes TrueNAS Connect when the system is not connected', () => {
    const messages = getMarketingMessages({
      status: TruenasConnectStatus.Disabled,
      tier: null,
    } as TruenasConnectConfig);

    expect(messages.some((message) => message.cta === 'Try out TrueNAS Connect')).toBe(true);
    expect(messages.some((message) => message.text === lastPromoteTncMessage)).toBe(true);
    expect(messages.every((message) => message.cta !== 'Upgrade to TrueNAS Connect Plus')).toBe(true);
  });

  it('promotes Plus when connected on the free Foundation tier', () => {
    const messages = getMarketingMessages({
      status: TruenasConnectStatus.Configured,
      tier: TruenasConnectTier.Foundation,
    } as TruenasConnectConfig);

    expect(messages.some((message) => message.cta === 'Upgrade to TrueNAS Connect Plus')).toBe(true);
    expect(messages.some((message) => message.text === 'Three Managed Systems. One Low Price.')).toBe(true);
    expect(messages.every((message) => message.cta !== 'Try out TrueNAS Connect')).toBe(true);
  });

  it('shows a non-clickable thank-you on the paid Plus tier with no upsell CTAs', () => {
    const messages = getMarketingMessages({
      status: TruenasConnectStatus.Configured,
      tier: TruenasConnectTier.Plus,
    } as TruenasConnectConfig);

    const thankYou = messages.find((message) => message.text === 'Thanks for supporting TrueNAS!');
    expect(thankYou).toBeTruthy();
    expect(thankYou.href).toBeNull();
    expect(messages.every((message) => {
      return message.cta !== 'Try out TrueNAS Connect' && message.cta !== 'Upgrade to TrueNAS Connect Plus';
    })).toBe(true);
  });

  it('treats the Business tier as a paid supporter', () => {
    const messages = getMarketingMessages({
      status: TruenasConnectStatus.Configured,
      tier: TruenasConnectTier.Business,
    } as TruenasConnectConfig);

    expect(messages.some((message) => message.text === 'Thanks for supporting TrueNAS!')).toBe(true);
  });

  it('always keeps enterprise awareness in the rotation', () => {
    const messages = getMarketingMessages({
      status: TruenasConnectStatus.Configured,
      tier: TruenasConnectTier.Plus,
    } as TruenasConnectConfig);

    expect(messages.some((message) => message.cta === 'Explore TrueNAS Enterprise')).toBe(true);
  });
});

describe('UseEnterpriseMarketingLinkComponent', () => {
  let spectator: Spectator<UseEnterpriseMarketingLinkComponent>;
  const config = signal<TruenasConnectConfig | undefined>(undefined);

  const createComponent = createComponentFactory({
    component: UseEnterpriseMarketingLinkComponent,
    providers: [
      mockProvider(TruenasConnectService, { config }),
    ],
  });

  beforeEach(() => {
    config.set(undefined);
    jest.spyOn(global.Date.prototype, 'toDateString').mockReturnValue('2025-02-26');
    localStorage.clear();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('shows the first enterprise tagline and its CTA by default', () => {
    spectator = createComponent();

    const link = spectator.query('a');
    expect(link).toHaveText(firstEnterpriseMessage);
    expect(link).toHaveText('Explore TrueNAS Enterprise');
    expect(link?.getAttribute('href')).toBe(`${exploreNasEnterpriseLink}?m=${hashMessage(firstEnterpriseMessage)}`);
  });

  it('rotates to the next message on a new day', () => {
    localStorage.setItem(lastShownDate, '2025-02-25');
    localStorage.setItem(lastMessageHash, hashMessage(firstEnterpriseMessage));
    spectator = createComponent();

    expect(spectator.query('a')).toHaveText('Boost Performance & Support');
  });

  it('loops back to the first message after the last one', () => {
    localStorage.setItem(lastShownDate, '2025-02-25');
    localStorage.setItem(lastMessageHash, hashMessage(lastPromoteTncMessage));
    spectator = createComponent();

    expect(spectator.query('a')).toHaveText(firstEnterpriseMessage);
  });

  it('persists the current date and message hash', () => {
    spectator = createComponent();

    expect(localStorage.getItem(lastShownDate)).toBe('2025-02-26');
    expect(localStorage.getItem(lastMessageHash)).toBe(hashMessage(firstEnterpriseMessage));
  });

  it('does not change the message within the same day', () => {
    localStorage.setItem(lastShownDate, '2025-02-26');
    localStorage.setItem(lastMessageHash, hashMessage('Boost Performance & Support'));
    spectator = createComponent();

    expect(spectator.query('a')).toHaveText('Boost Performance & Support');
  });

  it('falls back to the first message when the stored hash is unknown', () => {
    localStorage.setItem(lastShownDate, '2025-02-26');
    localStorage.setItem(lastMessageHash, 'unknownHash');
    spectator = createComponent();

    expect(spectator.query('a')).toHaveText(firstEnterpriseMessage);
  });

  it('points TrueNAS Connect messages at connect.truenas.com', () => {
    config.set({
      status: TruenasConnectStatus.Configured,
      tier: TruenasConnectTier.Foundation,
    } as TruenasConnectConfig);
    localStorage.setItem(lastShownDate, '2025-02-26');
    localStorage.setItem(lastMessageHash, hashMessage('Three Managed Systems. One Low Price.'));
    spectator = createComponent();

    expect(spectator.query('a')?.getAttribute('href')).toBe(
      `${truenasConnectLink}?m=${hashMessage('Three Managed Systems. One Low Price.')}`,
    );
  });

  it('renders the thank-you message as static text without a link', () => {
    config.set({
      status: TruenasConnectStatus.Configured,
      tier: TruenasConnectTier.Plus,
    } as TruenasConnectConfig);
    localStorage.setItem(lastShownDate, '2025-02-26');
    localStorage.setItem(lastMessageHash, hashMessage('Thanks for supporting TrueNAS!'));
    spectator = createComponent();

    expect(spectator.query('a')).toBeNull();
    expect(spectator.query('.no-link')).toHaveText('Thanks for supporting TrueNAS!');
  });
});
