import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { EventEmitter } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockJob, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { App } from 'app/interfaces/app.interface';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AppDeleteDialogComponent } from 'app/pages/apps/components/app-delete-dialog/app-delete-dialog.component';
import { CustomAppFormComponent } from 'app/pages/apps/components/custom-app-form/custom-app-form.component';
import { AppInfoCardComponent } from 'app/pages/apps/components/installed-apps/app-info-card/app-info-card.component';
import { AppRollbackModalComponent } from 'app/pages/apps/components/installed-apps/app-rollback-modal/app-rollback-modal.component';
import { AppUpgradeDialogComponent } from 'app/pages/apps/components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { RedirectService } from 'app/services/redirect.service';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

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
      'Web UI': 'http://localhost:8000/ui',
      'Admin Panel': 'http://localhost:8000/admin',
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
    afterClosed: () => of(true),
  } as unknown as MatDialogRef<AppUpgradeDialogComponent>;

  const createComponent = createComponentFactory({
    component: AppInfoCardComponent,
    providers: [
      mockProvider(ApplicationsService, {
        getAppUpgradeSummary: jest.fn(() => of(upgradeSummary)),
        checkIfAppIxVolumeExists: jest.fn(() => of(true)),
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
      mockProvider(MatDialog, {
        open: jest.fn(() => mockDialogRef),
      }),
      mockProvider(RedirectService),
      mockAuth(),
      mockApi([
        mockJob('app.convert_to_custom'),
        mockJob('app.upgrade'),
        mockJob('app.delete'),
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

  it('shows app name as a link', () => {
    setupTest(fakeApp);
    spectator.detectChanges();
    const appNameLink = spectator.query('.details-list a.value');
    expect(appNameLink).toHaveText('test-user-app-name');
    expect(appNameLink).toHaveAttribute('href', '/apps/available/stable/ix-test-app');
  });

  it('shows details', () => {
    setupTest(fakeApp);
    const detailsElements = spectator.queryAll('.details-item');
    const details = detailsElements.map((element) => ({
      label: element.querySelector('.label').textContent,
      value: element.querySelector('.value').textContent.trim(),
    }));
    expect(details).toEqual([
      {
        label: 'Name:',
        value: 'test-user-app-name',
      },
      {
        label: 'App Version:',
        value: 'v3.2.1',
      },
      {
        label: 'Version:',
        value: 'v1.2.3',
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
    expect(spectator.query('mat-card-header h3')).toHaveText('Application Info');
    expect(spectator.query('mat-card-header button#edit-app')).toHaveText('Edit');

    const menu = await loader.getHarness(MatMenuHarness.with({ selector: '[ixTest="app-info-menu"]' }));
    await menu.open();

    const menuItems = await menu.getItems();
    expect(menuItems).toHaveLength(2);
    expect(await menuItems[0].getText()).toContain('Update');
    expect(await menuItems[1].getText()).toContain('Convert to custom app');
  });

  it('opens upgrade app dialog when Update button is pressed', async () => {
    setupTest(fakeApp);

    const menu = await loader.getHarness(MatMenuHarness.with({ selector: '[ixTest="app-info-menu"]' }));
    await menu.clickItem({ text: 'Update' });

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(AppUpgradeDialogComponent, {
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

    const menu = await loader.getHarness(MatMenuHarness.with({ selector: '[ixTest="app-info-menu"]' }));
    await menu.clickItem({ text: 'Convert to custom app' });

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenLastCalledWith('app.convert_to_custom', ['test-user-app-name']);
  });

  it('navigates to app edit page when Edit button is pressed', async () => {
    setupTest(fakeApp);

    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(router.navigate).toHaveBeenCalledWith(['/apps', 'installed', fakeApp.metadata.train, fakeApp.id, 'edit']);
  });

  it('opens slide-in form to edit custom app when Edit button is pressed', async () => {
    setupTest({ ...fakeApp, custom_app: true });

    const slideIn = spectator.inject(SlideInService);
    jest.spyOn(slideIn, 'open').mockImplementation();

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(slideIn.open).toHaveBeenCalledWith(CustomAppFormComponent, {
      data:
      { ...fakeApp, custom_app: true },
    });
  });

  it('opens delete app dialog when Delete button is pressed', async () => {
    setupTest(fakeApp);
    jest.spyOn(spectator.inject(MatDialog), 'open').mockReturnValue({
      afterClosed: () => of({ removeVolumes: true, removeImages: true }),
    } as MatDialogRef<unknown>);

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(
      AppDeleteDialogComponent,
      { data: { name: 'test-user-app-name', showRemoveVolumes: true } },
    );
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
      'app.delete',
      [fakeApp.name, { remove_images: true, remove_ix_volumes: true }],
    );
  });

  it('shows portal buttons and opens a URL when one of the button is clicked', async () => {
    setupTest(fakeApp);

    const buttons = await loader.getAllHarnesses(MatButtonHarness.with({ ancestor: '.portals' }));

    expect(buttons).toHaveLength(2);
    expect(await buttons[0].getText()).toBe('Admin Panel');
    expect(await buttons[1].getText()).toBe('Web UI');

    await buttons[1].click();

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

    const buttons = await loader.getAllHarnesses(MatButtonHarness.with({ ancestor: '.portals' }));

    expect(buttons).toHaveLength(2);
    expect(await buttons[0].getText()).toBe('Admin Panel');
    expect(await buttons[1].getText()).toBe('Web UI');

    await buttons[0].click();
    expect(spectator.inject(RedirectService).openWindow).toHaveBeenCalledWith('http://localhost:8000/');

    await buttons[1].click();
    expect(spectator.inject(RedirectService).openWindow).toHaveBeenCalledWith('http://localhost:8000/ui?q=ui#yes');
  });

  it('opens rollback app dialog when Roll Back button is pressed', async () => {
    setupTest(fakeApp);

    const rollbackButton = await loader.getHarness(MatButtonHarness.with({ text: 'Roll Back' }));
    await rollbackButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(AppRollbackModalComponent, {
      data: fakeApp,
    });
  });
});
