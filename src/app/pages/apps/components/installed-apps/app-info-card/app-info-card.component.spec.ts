import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { EventEmitter } from '@angular/core';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
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
        'http://github.com/ix-test-app/ix-test-app',
      ],
    },
    catalog: 'OFFICIAL',
    catalog_train: 'charts',
  } as unknown as ChartRelease;

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
    expect(spectator.query('mat-card-header button')).toHaveText('Update');
  });

  it('shows details', () => {
    const details = spectator.queryAll('.details-item');
    expect(details).toHaveLength(5);

    expect(details[0].querySelector('.label')).toHaveText('Name:');
    expect(details[0].querySelector('.value')).toHaveText('ix-test-app');

    expect(details[1].querySelector('.label')).toHaveText('Version:');
    expect(details[1].querySelector('.value')).toHaveText('1.2.3_3.2.1');

    // TODO: https://ixsystems.atlassian.net/browse/NAS-121706
    // expect(details[2].querySelector('.label')).toHaveText('Latest Updated:');
    // expect(details[2].querySelector('.value')).toHaveText('N/A');

    expect(details[2].querySelector('.label')).toHaveText('Source:');
    expect(details[2].querySelector('.value')).toHaveText('http://github.com/ix-test-app/ix-test-app');

    // expect(details[4].querySelector('.label')).toHaveText('Developer:');
    // expect(details[4].querySelector('.value')).toHaveText('N/A');

    // expect(details[5].querySelector('.label')).toHaveText('Commits in the last 60 days:');
    // expect(details[5].querySelector('.value')).toHaveText('N/A');

    expect(details[3].querySelector('.label')).toHaveText('Catalog:');
    expect(details[3].querySelector('.value')).toHaveText('OFFICIAL');

    expect(details[4].querySelector('.label')).toHaveText('Train:');
    expect(details[4].querySelector('.value')).toHaveText('charts');
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
