import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnDialog, TnMenuHarness, TnMenuTesting, TnSidePanelHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockApi, mockJob, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AppState } from 'app/enums/app-state.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { App } from 'app/interfaces/app.interface';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AppDeleteDialog } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.component';
import { CustomAppFormComponent } from 'app/pages/apps/components/custom-app-form/custom-app-form.component';
import { AppInfoCardComponent } from 'app/pages/apps/components/installed-apps/app-info-card/app-info-card.component';
import { AppRollbackModalComponent } from 'app/pages/apps/components/installed-apps/app-rollback-modal/app-rollback-modal.component';
import { AppUpdateDialog } from 'app/pages/apps/components/installed-apps/app-update-dialog/app-update-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { RedirectService } from 'app/services/redirect.service';

describe('AppInfoCardComponent', () => {
  let spectator: Spectator<AppInfoCardComponent>;
  let loader: HarnessLoader;

  const fakeApp = {
    id: 'ix-test-app',
    name: 'test-user-app-name',
    human_version: '1.2.3_3.2.1',
    upgrade_available: true,
    version: '1.2.3',
    metadata: {
      name: 'ix-test-app',
      icon: '',
      sources: [
        'http://github.com/ix-test-app/ix-test-app/',
      ],
      app_version: '3.2.1',
      train: 'stable',
    },
    portals: {
      'Admin Panel': 'http://localhost:8000/admin',
      'Web UI': 'http://localhost:8000/ui',
    } as Record<string, string>,
    custom_app: false,
  } as App;

  const upgradeSummary = {} as AppUpgradeSummary;

  const mockDialogRef = {
    componentInstance: {
      setDescription: jest.fn(),
      setCall: jest.fn(),
      submit: jest.fn(),
      success: new EventEmitter(),
      failure: new EventEmitter(),
    },
    close: jest.fn(),
    closed: of(true),
  } as unknown as DialogRef<unknown, AppUpdateDialog>;

  const mockWindow = {
    location: {
      hostname: 'localhost',
    },
  } as Window;

  const createComponent = createComponentFactory({
    component: AppInfoCardComponent,
    providers: [
      {
        provide: WINDOW,
        useValue: mockWindow,
      },
      mockProvider(ApplicationsService, {
        getAppUpgradeSummary: jest.fn(() => of(upgradeSummary)),
        checkIfAppIxVolumeExists: jest.fn(() => of(true)),
        // Used by the CustomAppForm rendered inside the edit side panel.
        getAllApps: jest.fn(() => of([])),
        getApp: jest.fn(() => of([{ ...fakeApp, custom_app: true }])),
      }),
      mockProvider(InstalledAppsStore, {
        installedApps$: of([]),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockProvider(TnDialog, {
        open: jest.fn(() => mockDialogRef),
      }),
      mockProvider(RedirectService),
      mockAuth(),
      mockApi([
        mockJob('app.convert_to_custom'),
        mockJob('app.upgrade'),
        mockJob('app.delete'),
        mockJob('app.create'),
        mockJob('app.update'),
        mockCall('app.rollback_versions', ['1.2.1']),
      ]),
    ],
  });

  function setupTest(app: App): void {
    spectator = createComponent({
      props: { app },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  }

  async function openMenu(): Promise<TnMenuHarness> {
    spectator.click('[data-test="button-app-info-menu"]');
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  describe('name', () => {
    it('shows app name as a link when app name matches image name', () => {
      setupTest({
        ...fakeApp,
        name: 'test-user-app-name',
        metadata: {
          ...fakeApp.metadata,
          name: 'test-user-app-name',
        },
      });
      spectator.detectChanges();
      const appNameLink = spectator.query('.details-list a.value');
      expect(appNameLink).toHaveText('test-user-app-name');
      expect(appNameLink).toHaveAttribute('href', '/apps/available/stable/test-user-app-name');
    });

    it('shows both name and image name when they are different', () => {
      setupTest(fakeApp);

      spectator.detectChanges();
      const appNameLink = spectator.query('.details-list a.value');
      expect(appNameLink).toHaveText('test-user-app-name (ix-test-app)');
    });

    it('shows name as a static text for custom apps', () => {
      setupTest({
        ...fakeApp,
        custom_app: true,
      });

      spectator.detectChanges();
      const appNameLink = spectator.query('.details-list .value')!;
      expect(appNameLink.tagName.toLowerCase()).toBe('span');
      expect(appNameLink).toHaveText('test-user-app-name');
    });
  });

  it('shows details', () => {
    setupTest(fakeApp);
    const detailsElements = spectator.queryAll('.details-item');
    const details = detailsElements.map((element) => ({
      label: element.querySelector('.label')!.textContent!,
      value: element.querySelector('.value')!.textContent!.trim(),
    }));
    expect(details).toMatchObject([
      {
        label: 'Name:',
        value: 'test-user-app-name (ix-test-app)',
      },
      {
        label: 'Version:',
        value: '3.2.1',
      },
      {
        label: 'Revision:',
        value: '1.2.3',
      },
      {
        label: 'Source:',
        value: 'github.com/ix-test-app/ix-test-app',
      },
      {
        label: 'Train:',
        value: 'stable',
      },
    ]);
  });

  it('shows header', async () => {
    setupTest(fakeApp);
    spectator.detectChanges();
    expect(spectator.query('.detail-card-title')).toHaveText('Application Info');
    expect(await (await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }))).getLabel()).toBe('Edit');

    const menu = await openMenu();

    const menuItems = await menu.getItemLabels();
    expect(menuItems.some((label) => label.includes('Update'))).toBe(true);
    expect(menuItems.some((label) => label.includes('Convert to custom app'))).toBe(true);
  });

  it('opens update app dialog when Update button is pressed', async () => {
    setupTest(fakeApp);

    const menu = await openMenu();
    await menu.clickItem({ label: 'Update' });

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(AppUpdateDialog, {
      maxWidth: '750px',
      minWidth: '500px',
      width: '50vw',
      data: {
        appInfo: fakeApp,
        upgradeSummary,
      },
    });
  });

  it('converts app to custom when Convert button is pressed', async () => {
    setupTest(fakeApp);

    const menu = await openMenu();
    await menu.clickItem({ label: 'Convert to custom app' });

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenLastCalledWith('app.convert_to_custom', ['test-user-app-name']);
  });

  it('navigates to app edit page when Edit button is pressed', async () => {
    setupTest(fakeApp);

    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();

    expect(router.navigate).toHaveBeenCalledWith(['/apps', 'installed', fakeApp.metadata.train, fakeApp.id, 'edit']);
  });

  it('opens the edit form in a side panel with the app when Edit is pressed for a custom app', async () => {
    const customApp = { ...fakeApp, custom_app: true };
    setupTest(customApp);

    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();
    spectator.detectChanges();

    const panel = await loader.getHarness(TnSidePanelHarness);
    expect(await panel.isOpen()).toBe(true);

    const form = spectator.query(CustomAppFormComponent);
    expect(form).toBeTruthy();
    expect(form?.app()).toEqual(customApp);
  });

  it('opens delete app dialog when Delete button is pressed', async () => {
    setupTest(fakeApp);
    jest.spyOn(spectator.inject(TnDialog), 'open').mockReturnValue({
      closed: of({ removeVolumes: true, removeImages: true }),
    } as DialogRef);

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(
      AppDeleteDialog,
      { data: { name: 'test-user-app-name', showRemoveVolumes: true } },
    );
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
      'app.delete',
      [fakeApp.name, { remove_images: true, remove_ix_volumes: true }],
    );
  });

  it('shows portal buttons and opens a URL when one of the button is clicked', async () => {
    setupTest(fakeApp);

    const buttons = await loader.getAllHarnesses(TnButtonHarness.with({ ancestor: '.portals' }));

    expect(buttons).toHaveLength(2);
    expect(await buttons[0].getLabel()).toBe('Web UI');
    expect(await buttons[1].getLabel()).toBe('Admin Panel');

    await buttons[0].click();

    expect(spectator.inject(RedirectService).openWindow).toHaveBeenCalledWith(fakeApp.portals['Web UI']);
  });

  it('opens a URL with the current host and port when the portal hostname is 0.0.0.0', async () => {
    setupTest({
      ...fakeApp,
      portals: {
        'Web UI': 'http://0.0.0.0:8000/ui?q=ui#yes',
        'Admin Panel': 'http://0.0.0.0:8000',
      },
    });

    const buttons = await loader.getAllHarnesses(TnButtonHarness.with({ ancestor: '.portals' }));

    expect(buttons).toHaveLength(2);
    expect(await buttons[0].getLabel()).toBe('Web UI');
    expect(await buttons[1].getLabel()).toBe('Admin Panel');

    await buttons[0].click();
    expect(spectator.inject(RedirectService).openWindow).toHaveBeenCalledWith('http://localhost:8000/ui?q=ui#yes');

    await buttons[1].click();
    expect(spectator.inject(RedirectService).openWindow).toHaveBeenCalledWith('http://localhost:8000/');
  });

  it('opens rollback app dialog when Roll Back button is pressed', async () => {
    setupTest(fakeApp);

    const rollbackButton = await loader.getHarness(TnButtonHarness.with({ label: 'Roll Back' }));
    await rollbackButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(AppRollbackModalComponent, {
      data: fakeApp,
    });
  });

  it('emits (stopApp) from the footer Stop button when the app is running', async () => {
    setupTest({ ...fakeApp, state: AppState.Running });
    jest.spyOn(spectator.component.stopApp, 'emit');

    const stopButton = await loader.getHarness(TnButtonHarness.with({ label: 'Stop' }));
    await stopButton.click();

    expect(spectator.component.stopApp.emit).toHaveBeenCalled();
  });

  it('emits (startApp) from the footer Start button when the app is stopped', async () => {
    setupTest({ ...fakeApp, state: AppState.Stopped });
    jest.spyOn(spectator.component.startApp, 'emit');

    const startButton = await loader.getHarness(TnButtonHarness.with({ label: 'Start' }));
    await startButton.click();

    expect(spectator.component.startApp.emit).toHaveBeenCalled();
  });

  it('handles malformed URLs gracefully', () => {
    setupTest({
      ...fakeApp,
      portals: {
        'Web UI': 'not-a-valid-url',
      },
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    spectator.component.openPortalLink(spectator.component.app(), 'Web UI');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Invalid portal URL:',
      'not-a-valid-url',
      expect.objectContaining({ message: expect.stringContaining('Invalid URL') }),
    );
    expect(spectator.inject(RedirectService).openWindow).toHaveBeenCalledWith('not-a-valid-url');

    consoleErrorSpy.mockRestore();
  });

  it('handles relative URLs gracefully', () => {
    setupTest({
      ...fakeApp,
      portals: {
        'Web UI': '/relative/path',
      },
    });

    const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();

    spectator.component.openPortalLink(spectator.component.app(), 'Web UI');

    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Invalid portal URL:',
      '/relative/path',
      expect.objectContaining({ message: expect.stringContaining('Invalid URL') }),
    );
    expect(spectator.inject(RedirectService).openWindow).toHaveBeenCalledWith('/relative/path');

    consoleErrorSpy.mockRestore();
  });
});
