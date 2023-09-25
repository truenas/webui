import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { EventEmitter } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { UpgradeSummary } from 'app/interfaces/application.interface';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { AppInfoCardComponent } from 'app/pages/apps/components/installed-apps/app-info-card/app-info-card.component';
import { AppRollbackModalComponent } from 'app/pages/apps/components/installed-apps/app-rollback-modal/app-rollback-modal.component';
import { AppUpgradeDialogComponent } from 'app/pages/apps/components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { AppCatalogPipe } from 'app/pages/apps/utils/app-catalog.pipe';
import { DialogService } from 'app/services/dialog.service';
import { RedirectService } from 'app/services/redirect.service';

describe('AppInfoCardComponent', () => {
  let spectator: Spectator<AppInfoCardComponent>;
  let loader: HarnessLoader;

  const app = {
    id: 'ix-test-app',
    name: 'test-user-app-name',
    human_version: '1.2.3_3.2.1',
    history: {
      '1.0.11': {
        name: 'ix-test-app',
      },
    } as { [key: string]: unknown },
    update_available: true,
    chart_metadata: {
      name: 'ix-test-app',
      icon: '',
      sources: [
        'http://github.com/ix-test-app/ix-test-app/',
      ],
      version: '1.2.3',
      appVersion: '3.2.1',
    },
    catalog: 'TRUENAS',
    catalog_train: 'charts',
  } as ChartRelease;

  const upgradeSummary = {} as UpgradeSummary;

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
    imports: [AppCatalogPipe],
    declarations: [
      MockComponents(
        AppCardLogoComponent,
        NgxSkeletonLoaderComponent,
      ),
    ],
    providers: [
      mockProvider(ApplicationsService, {
        getChartUpgradeSummary: jest.fn(() => of(upgradeSummary)),
      }),
      mockProvider(InstalledAppsStore, {
        installedApps$: of([]),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockDialogRef),
      }),
      mockProvider(RedirectService),
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

  it('shows header', () => {
    expect(spectator.query('mat-card-header h3')).toHaveText('Application Info');
    expect(spectator.query('mat-card-header button#edit-app')).toHaveText('Edit');
    expect(spectator.query('mat-card-header button#update-app')).toHaveText('Update');
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
        label: 'Chart Version:',
        value: '1.2.3',
      },
      // TODO: https://ixsystems.atlassian.net/browse/NAS-121706
      {
        label: 'Last Updated:',
        value: 'N/A',
      },
      {
        label: 'Source:',
        value: 'github.com/ix-test-app/ix-test-app',
      },
      // TODO: https://ixsystems.atlassian.net/browse/NAS-121706
      {
        label: 'Developer:',
        value: 'N/A',
      },
      {
        label: 'Catalog:',
        value: 'TrueNAS',
      },
      {
        label: 'Train:',
        value: 'charts',
      },
    ]);
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

    expect(router.navigate).toHaveBeenCalledWith(['/apps', 'installed', app.catalog, app.catalog_train, app.id, 'edit']);
  });

  it('opens delete app dialog when Delete button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Delete',
      message: 'Delete test-user-app-name?',
    });
  });

  it('opens rollback app dialog when Roll Back button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Roll Back' }));
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(AppRollbackModalComponent, {
      data: app,
    });
  });
});
