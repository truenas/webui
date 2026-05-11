import { signal } from '@angular/core';
import { provideRouter, Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
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

  const alertsSignal = signal([
    lockedShareAlert,
    rootLoginAlert,
    dismissedDatasetAlert,
    storageAlert,
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

  beforeEach(() => {
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
});
