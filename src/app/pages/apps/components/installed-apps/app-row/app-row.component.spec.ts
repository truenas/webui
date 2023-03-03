import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';

describe('AppRowComponent', () => {
  let spectator: Spectator<AppRowComponent>;
  const application = {
    name: 'app_name',
    status: ChartReleaseStatus.Active,
    chart_metadata: { icon: 'https://image/' },
  } as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppRowComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { application },
    });
  });

  it('shows "Application"', () => {
    expect(spectator.query('.name')).toHaveText(application.name);
  });

  it('shows "Status"', () => {
    expect(spectator.query('.cell-status .status')).toHaveText('Active');
  });
});
