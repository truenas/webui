import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { officialCatalog, chartsTrain } from 'app/constants/catalog.constants';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppCardLogoComponent } from 'app/pages/apps/components/app-card-logo/app-card-logo.component';
import { AppInfoCardComponent } from 'app/pages/apps/components/installed-apps/app-info-card/app-info-card.component';

describe('AppInfoCardComponent', () => {
  let spectator: Spectator<AppInfoCardComponent>;

  const app = {
    id: 'ix-test-app',
    name: 'ix-test-app',
    human_version: '1.2.3_3.2.1',
    update_available: true,
    chart_metadata: {
      name: 'ix-test-app',
      icon: '',
      sources: [],
    },
    catalog: officialCatalog,
    catalog_train: chartsTrain,
  } as unknown as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppInfoCardComponent,
    declarations: [AppCardLogoComponent],
    providers: [],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app,
      },
    });
  });

  it('shows header', () => {
    expect(spectator.query('mat-card-header h3')).toHaveText('Application Info');
    expect(spectator.query('mat-card-header button')).toHaveText('Update');
  });

  it('shows details', () => {
    const details = spectator.queryAll('.details-item');
    expect(details).toHaveLength(8);

    expect(details[0].querySelector('.label')).toHaveText('Name:');
    expect(details[0].querySelector('.value')).toHaveText('ix-test-app');

    expect(details[1].querySelector('.label')).toHaveText('Version:');
    expect(details[1].querySelector('.value')).toHaveText('1.2.3_3.2.1');

    expect(details[2].querySelector('.label')).toHaveText('Latest Updated:');
    expect(details[2].querySelector('.value')).toHaveText('N/A');

    expect(details[3].querySelector('.label')).toHaveText('Source:');
    expect(details[3].querySelector('.value')).toHaveText('N/A');

    expect(details[4].querySelector('.label')).toHaveText('Developer:');
    expect(details[4].querySelector('.value')).toHaveText('N/A');

    expect(details[5].querySelector('.label')).toHaveText('Commits in the last 60 days:');
    expect(details[5].querySelector('.value')).toHaveText('N/A');

    expect(details[6].querySelector('.label')).toHaveText('Catalog:');
    expect(details[6].querySelector('.value')).toHaveText('OFFICIAL');

    expect(details[7].querySelector('.label')).toHaveText('Train:');
    expect(details[7].querySelector('.value')).toHaveText('charts');
  });
});
