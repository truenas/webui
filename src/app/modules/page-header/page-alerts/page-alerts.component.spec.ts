import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { provideMockStore } from '@ngrx/store/testing';
import { LangChangeEvent, TranslateService } from '@ngx-translate/core';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { EnhancedAlert } from 'app/interfaces/smart-alert.interface';
import { getAlertEnhancement } from 'app/modules/alerts/services/alert-enhancement.registry';
import { AlertNavBadgeService } from 'app/modules/alerts/services/alert-nav-badge.service';
import { PageAlertsComponent } from 'app/modules/page-header/page-alerts/page-alerts.component';

describe('PageAlertsComponent', () => {
  let spectator: Spectator<PageAlertsComponent>;
  let router: Router;

  const lockedShareAlert = {
    id: 'locked-share',
    uuid: 'locked-share',
    key: 'locked-share-key',
    level: AlertLevel.Warning,
    formatted: 'NFS share is unavailable because it uses a locked dataset.',
    dismissed: false,
    datetime: { $date: 1 },
    relatedMenuPath: ['datasets'],
  } as unknown as Alert & EnhancedAlert;

  const rootLoginAlert = {
    id: 'root-login',
    uuid: 'root-login',
    key: 'root-login-key',
    level: AlertLevel.Warning,
    formatted: 'Root account used to authenticate.',
    dismissed: false,
    datetime: { $date: 1 },
    relatedMenuPath: ['credentials', 'users'],
  } as unknown as Alert & EnhancedAlert;

  const dismissedDatasetAlert = {
    id: 'dismissed-dataset',
    uuid: 'dismissed-dataset',
    key: 'dismissed-dataset-key',
    level: AlertLevel.Warning,
    formatted: 'Dismissed dataset alert.',
    dismissed: true,
    datetime: { $date: 1 },
    relatedMenuPath: ['datasets'],
  } as unknown as Alert & EnhancedAlert;

  const storageAlert = {
    id: 'storage-alert',
    uuid: 'storage-alert',
    key: 'storage-alert-key',
    level: AlertLevel.Warning,
    formatted: 'Storage pool is degraded.',
    dismissed: false,
    datetime: { $date: 1 },
    relatedMenuPath: ['storage'],
  } as unknown as Alert & EnhancedAlert;

  const apiKeyAlert = {
    id: 'api-key-revoked',
    uuid: 'api-key-revoked',
    key: 'api-key-revoked-key',
    level: AlertLevel.Warning,
    formatted: 'API key has been revoked and must either be renewed or deleted.',
    dismissed: false,
    datetime: { $date: 1 },
    relatedMenuPath: ['credentials'],
    bannerMenuPath: ['credentials', 'users', 'api-keys'],
  } as unknown as Alert & EnhancedAlert;

  const poolUpgradeAlerts = ['newpool', 'ggdraid', 'basicpool'].map((pool, index) => ({
    id: `pool-upgrade-${pool}`,
    uuid: `pool-upgrade-${pool}`,
    key: `pool-upgrade-${pool}-key`,
    klass: AlertClassName.PoolUpgraded,
    level: AlertLevel.Warning,
    formatted: `New ZFS version or feature flags are available for pool '${pool}'. Upgrading pools is a one-time `
      + 'process that can prevent rolling the system back to an earlier TrueNAS version.',
    dismissed: false,
    datetime: { $date: index + 1 },
    relatedMenuPath: ['storage'],
    groupSummary: '{count, plural, other {# pools can be upgraded}}',
  })) as unknown as (Alert & EnhancedAlert)[];

  // A class the registry gives no groupSummary (asserted below), so these must keep
  // rendering as separate banners.
  const noHeadlineClass = AlertClassName.Smartd;
  const smartdAlerts = ['sda', 'sdb'].map((disk, index) => ({
    id: `smartd-${disk}`,
    uuid: `smartd-${disk}`,
    key: `smartd-${disk}-key`,
    klass: noHeadlineClass,
    level: AlertLevel.Warning,
    formatted: `smartd is not running for disk ${disk}.`,
    dismissed: false,
    datetime: { $date: index + 1 },
    relatedMenuPath: ['storage'],
  })) as unknown as (Alert & EnhancedAlert)[];

  const alertsSignal = signal([
    lockedShareAlert,
    rootLoginAlert,
    dismissedDatasetAlert,
    storageAlert,
    apiKeyAlert,
    ...poolUpgradeAlerts,
    ...smartdAlerts,
  ]);

  const createComponent = createComponentFactory({
    component: PageAlertsComponent,
    providers: [
      provideRouter([
        { path: '**', children: [] },
      ]),
      provideMockStore(),
      mockProvider(AlertNavBadgeService, {
        getEnhancedAlerts: () => alertsSignal,
      }),
    ],
  });

  async function setUrl(url: string): Promise<void> {
    await router.navigateByUrl(url);
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  }

  const initialAlerts = alertsSignal();

  beforeEach(() => {
    spectator = createComponent();
    router = spectator.inject(Router);
  });

  afterEach(() => {
    // The signal is shared across tests, so anything a test pushes has to be undone.
    alertsSignal.set(initialAlerts);
  });

  function renderedMessages(): string[] {
    return spectator.queryAll('.alert-message').map((el) => el.textContent?.trim() || '');
  }

  function bannerWith(message: string): HTMLElement {
    const banner = spectator.queryAll('.page-alert')
      .find((element) => element.querySelector('.alert-message')?.textContent?.includes(message));
    if (!banner) {
      throw new Error(`No banner showing "${message}"`);
    }
    return banner as HTMLElement;
  }

  it('shows a datasets alert on a nested dataset URL (prefix match)', async () => {
    await setUrl('/datasets/sanity/tr');

    const messages = renderedMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('locked dataset');
  });

  it('shows a credentials/users alert on /credentials/users (exact match)', async () => {
    await setUrl('/credentials/users');

    const messages = renderedMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('Root account');
  });

  it('shows a datasets alert on the exact /datasets route', async () => {
    await setUrl('/datasets');

    const messages = renderedMessages();
    expect(messages).toHaveLength(1);
    expect(messages[0]).toContain('locked dataset');
  });

  it('does not show alerts for sibling menu paths', async () => {
    await setUrl('/datasets');

    const messages = renderedMessages();
    expect(messages.some((message) => message.includes('Storage pool'))).toBe(false);
  });

  it('does not show a datasets alert on an unrelated route', async () => {
    await setUrl('/storage');

    const messages = renderedMessages();
    expect(messages.some((message) => message.includes('locked dataset'))).toBe(false);
  });

  it('excludes dismissed alerts', async () => {
    await setUrl('/datasets');

    const messages = renderedMessages();
    expect(messages.some((message) => message.includes('Dismissed'))).toBe(false);
  });

  it('scopes the banner to bannerMenuPath when provided, not relatedMenuPath', async () => {
    await setUrl('/credentials/users/api-keys');

    const messages = renderedMessages();
    expect(messages.some((message) => message.includes('API key has been revoked'))).toBe(true);
  });

  it('matches the route even when a query string is present', async () => {
    await setUrl('/credentials/users/api-keys?userName=root');

    const messages = renderedMessages();
    expect(messages.some((message) => message.includes('API key has been revoked'))).toBe(true);
  });

  it('consolidates alerts of the same class into a single banner', async () => {
    await setUrl('/storage');

    const messages = renderedMessages();
    expect(messages).toContain('3 pools can be upgraded');
    expect(messages.filter((message) => message.includes('can be upgraded'))).toHaveLength(1);
  });

  it('leaves classes without a group headline as separate banners', async () => {
    // Guards the fixture: the test only means anything while this class has no headline.
    expect(getAlertEnhancement('', noHeadlineClass)?.groupSummary).toBeUndefined();

    await setUrl('/storage');

    const messages = renderedMessages();
    expect(messages).toContain('smartd is not running for disk sda.');
    expect(messages).toContain('smartd is not running for disk sdb.');
  });

  it('shows how many alerts a banner stands for', async () => {
    await setUrl('/storage');

    expect(bannerWith('3 pools can be upgraded').querySelector('.duplicate-count-badge')).toHaveText('3');
  });

  it('reveals every consolidated message behind Show More', async () => {
    await setUrl('/storage');

    spectator.click(bannerWith('3 pools can be upgraded').querySelector('.toggle-btn') as HTMLElement);

    const details = Array.from(bannerWith('3 pools can be upgraded').querySelectorAll('.alert-detail'))
      .map((element) => element.textContent?.trim());
    expect(details).toHaveLength(3);
    expect(details[0]).toContain("pool 'basicpool'");
    expect(details[0]).toContain('rolling the system back');
  });

  it('dismisses every consolidated alert at once', async () => {
    await setUrl('/storage');
    const dispatchSpy = jest.spyOn(spectator.inject(Store), 'dispatch');

    spectator.click(bannerWith('3 pools can be upgraded').querySelector('.dismiss-btn') as HTMLElement);

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: '[Alert Panel] Dismiss Pressed',
        ids: ['pool-upgrade-newpool', 'pool-upgrade-ggdraid', 'pool-upgrade-basicpool'],
      }),
    );
  });

  it('shortens a long message to its first sentence', async () => {
    await setUrl('/storage');

    expect(renderedMessages().some((message) => message.includes('rolling the system back'))).toBe(false);
  });

  it('re-translates cached banner strings when the language changes', async () => {
    await setUrl('/storage');
    const translate = spectator.inject(TranslateService);
    const instantSpy = jest.spyOn(translate, 'instant');
    instantSpy.mockClear();

    translate.onLangChange.emit({ lang: 'de', translations: {} } as LangChangeEvent);
    spectator.detectChanges();

    // The headline is memoized in the view model, so it must be rebuilt on a switch.
    expect(instantSpy).toHaveBeenCalledWith(
      '{count, plural, other {# pools can be upgraded}}',
      { count: 3 },
    );
  });

  it('keeps a banner expanded when a newer alert joins its group', async () => {
    await setUrl('/storage');
    spectator.click(bannerWith('3 pools can be upgraded').querySelector('.toggle-btn') as HTMLElement);
    expect(bannerWith('3 pools can be upgraded').querySelectorAll('.alert-detail')).toHaveLength(3);

    // Consolidation picks the newest alert as the representative, so this changes the
    // entry's id. Expansion is keyed by the consolidation key precisely so it survives.
    alertsSignal.set([...alertsSignal(), {
      ...poolUpgradeAlerts[0],
      id: 'pool-upgrade-newest',
      uuid: 'pool-upgrade-newest',
      key: 'pool-upgrade-newest-key',
      formatted: "New ZFS version or feature flags are available for pool 'newest'.",
      datetime: { $date: 99 },
    } as unknown as Alert & EnhancedAlert]);
    spectator.detectChanges();

    const banner = bannerWith('4 pools can be upgraded');
    expect(banner.querySelector('.toggle-btn')).toHaveText('Show Less');
    expect(banner.querySelectorAll('.alert-detail')).toHaveLength(4);
  });

  it('does not show a bannerMenuPath-scoped alert on parent routes', async () => {
    await setUrl('/credentials/users');

    const messages = renderedMessages();
    expect(messages.some((message) => message.includes('API key has been revoked'))).toBe(false);
  });
});
