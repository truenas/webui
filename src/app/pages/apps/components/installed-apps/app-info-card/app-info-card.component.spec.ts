import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { EventEmitter } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponents, MockDirective } from 'ng-mocks';
import { ImgFallbackDirective } from 'ngx-img-fallback';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockJob, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { App } from 'app/interfaces/app.interface';
import { AppUpgradeSummary } from 'app/interfaces/application.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { CleanLinkPipe } from 'app/modules/pipes/clean-link/clean-link.pipe';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { AppInfoCardComponent } from 'app/pages/apps/components/installed-apps/app-info-card/app-info-card.component';
import { AppRollbackModalComponent } from 'app/pages/apps/components/installed-apps/app-rollback-modal/app-rollback-modal.component';
import { AppUpgradeDialogComponent } from 'app/pages/apps/components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { RedirectService } from 'app/services/redirect.service';
import { WebSocketService } from 'app/services/ws.service';

describe('AppInfoCardComponent', () => {
  let spectator: Spectator<AppInfoCardComponent>;
  let loader: HarnessLoader;

  const app = {
    id: 'ix-test-app',
    name: 'test-user-app-name',
    human_version: '1.2.3_3.2.1',
    upgrade_available: true,
    metadata: {
      name: 'ix-test-app',
      icon: '',
      sources: [
        'http://github.com/ix-test-app/ix-test-app/',
      ],
      version: '1.2.3',
      app_version: '3.2.1',
      train: 'stable',
    },
    portals: {
      'Web UI': 'http://localhost:8000/ui',
      'Admin Panel': 'http://localhost:8000/admin',
    } as Record<string, string>,
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
    imports: [
      CleanLinkPipe,
      OrNotAvailablePipe,
    ],
    declarations: [
      MockComponents(
        AppCardLogoComponent,
        NgxSkeletonLoaderComponent,
      ),
      MockDirective(ImgFallbackDirective),
    ],
    providers: [
      mockProvider(ApplicationsService, {
        getAppUpgradeSummary: jest.fn(() => of(upgradeSummary)),
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
      mockWebSocket([
        mockJob('app.upgrade'),
        mockJob('app.delete'),
        mockCall('app.rollback_versions', ['1.2.1']),
      ]),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows app name as a link', () => {
    spectator.detectChanges();
    const appNameLink = spectator.query('.details-list a.value');
    expect(appNameLink).toHaveText('test-user-app-name');
    expect(appNameLink).toHaveAttribute('href', '/apps/available/stable/ix-test-app');
  });

  it('shows details', () => {
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
        value: '3.2.1',
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

  it('shows header', () => {
    spectator.detectChanges();
    expect(spectator.query('mat-card-header h3')).toHaveText('Application Info');
    expect(spectator.query('mat-card-header button#edit-app')).toHaveText('Edit');
    expect(spectator.query('mat-card-header button#update-app')).toHaveText('Update');
  });

  it('opens upgrade app dialog when Update button is pressed', async () => {
    const updateButton = await loader.getHarness(MatButtonHarness.with({ text: 'Update' }));
    await updateButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(AppUpgradeDialogComponent, {
      maxWidth: '750px',
      minWidth: '500px',
      width: '50vw',
      data: {
        appInfo: app,
        upgradeSummary,
      },
    });
  });

  it('navigates to app edit page when Edit button is pressed', async () => {
    const router = spectator.inject(Router);
    jest.spyOn(router, 'navigate').mockImplementation();

    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(router.navigate).toHaveBeenCalledWith(['/apps', 'installed', app.metadata.train, app.id, 'edit']);
  });

  it('opens delete app dialog when Delete button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Delete',
      message: 'Delete test-user-app-name?',
    });
    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(
      'app.delete',
      [app.name, { remove_images: true }],
    );
  });

  it('shows portal buttons and opens a URL when one of the button is clicked', async () => {
    const buttons = await loader.getAllHarnesses(MatButtonHarness.with({ ancestor: '.portals' }));

    expect(buttons).toHaveLength(2);
    expect(await buttons[0].getText()).toBe('Admin Panel');
    expect(await buttons[1].getText()).toBe('Web UI');

    await buttons[1].click();

    expect(spectator.inject(RedirectService).openWindow).toHaveBeenCalledWith(app.portals['Web UI']);
  });

  it('opens rollback app dialog when Roll Back button is pressed', async () => {
    const rollbackButton = await loader.getHarness(MatButtonHarness.with({ text: 'Roll Back' }));
    await rollbackButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(AppRollbackModalComponent, {
      data: app,
    });
  });
});
