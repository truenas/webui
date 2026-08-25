import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { AlertClassName } from 'app/enums/alert-class-name.enum';
import { AlertLevel } from 'app/enums/alert-level.enum';
import { Alert } from 'app/interfaces/alert.interface';
import { EnhancedAlert } from 'app/interfaces/smart-alert.interface';
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

  const tierWarningAlert = {
    id: 'tier-warning',
    uuid: 'tier-warning',
    // Middleware keys both tier alerts on the pool name alone.
    key: '"hddpool"',
    klass: AlertClassName.TierSpecialVdevWarning,
    level: AlertLevel.Warning,
    formatted: 'Pool hddpool: special allocation class usage exceeds 60%.',
    dismissed: false,
    datetime: { $date: 1 },
    relatedMenuPath: ['storage'],
    extraMenuPaths: [['datasets']],
  } as unknown as Alert & EnhancedAlert;

  const tierCriticalAlert = {
    id: 'tier-critical',
    uuid: 'tier-critical',
    key: '"hddpool"',
    klass: AlertClassName.TierSpecialVdevCritical,
    level: AlertLevel.Critical,
    formatted: 'Pool hddpool: special allocation class usage exceeds 70%.',
    dismissed: false,
    datetime: { $date: 2 },
    relatedMenuPath: ['storage'],
    extraMenuPaths: [['datasets']],
  } as unknown as Alert & EnhancedAlert;

  const defaultAlerts = [
    lockedShareAlert,
    rootLoginAlert,
    dismissedDatasetAlert,
    storageAlert,
    apiKeyAlert,
  ];

  const alertsSignal = signal(defaultAlerts);

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

  beforeEach(() => {
    alertsSignal.set(defaultAlerts);
    spectator = createComponent();
    router = spectator.inject(Router);
  });

  function renderedMessages(): string[] {
    return spectator.queryAll('.alert-message').map((el) => el.textContent?.trim() || '');
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

  it('does not show a bannerMenuPath-scoped alert on parent routes', async () => {
    await setUrl('/credentials/users');

    const messages = renderedMessages();
    expect(messages.some((message) => message.includes('API key has been revoked'))).toBe(false);
  });

  describe('alerts spanning several feature areas (NAS-142267)', () => {
    beforeEach(() => {
      alertsSignal.set([tierWarningAlert, tierCriticalAlert]);
    });

    it.each(['/storage', '/datasets'])('shows a tiering alert on %s', async (url) => {
      await setUrl(url);

      const messages = renderedMessages();
      expect(messages.some((message) => message.includes('special allocation class'))).toBe(true);
    });

    it('does not show a tiering alert on an unrelated route', async () => {
      await setUrl('/credentials/users');

      expect(renderedMessages()).toEqual([]);
    });

    it('keeps alert classes that share a middleware key apart instead of counting them as duplicates', async () => {
      await setUrl('/storage');

      expect(renderedMessages()).toHaveLength(2);
      expect(spectator.queryAll('.duplicate-count-badge')).toEqual([]);
    });
  });
});
