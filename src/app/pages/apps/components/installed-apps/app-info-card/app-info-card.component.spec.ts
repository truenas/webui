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
import { AppUpgradeDialogComponent } from 'app/pages/apps/components/installed-apps/app-upgrade-dialog/app-upgrade-dialog.component';
import { ApplicationsService } from 'app/pages/apps/services/applications.service';
import { InstalledAppsStore } from 'app/pages/apps/store/installed-apps-store.service';
import { AppLoaderService, DialogService, RedirectService } from 'app/services';

describe('AppInfoCardComponent', () => {
  let spectator: Spectator<AppInfoCardComponent>;
  let loader: HarnessLoader;

  const app = {
    id: 'ix-test-app',
    name: 'ix-test-app',
    human_version: '1.2.3_3.2.1',
    update_available: true,
    chart_metadata: {
      name: 'ix-test-app',
      icon: '',
      sources: [
        'http://github.com/ix-test-app/ix-test-app/',
      ],
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
      mockProvider(AppLoaderService),
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
        value: 'ix-test-app',
      },
      {
        label: 'Version:',
        value: '1.2.3_3.2.1',
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
        value: 'TRUENAS',
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

    expect(router.navigate).toHaveBeenCalledWith(['/apps', 'available', app.catalog, app.catalog_train, app.id, 'edit']);
  });

  it('opens delete app dialog when Delete button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Delete',
      message: 'Delete ix-test-app?',
      secondaryCheckbox: true,
      secondaryCheckboxText: 'Delete docker images used by the app',
    });
  });
});
