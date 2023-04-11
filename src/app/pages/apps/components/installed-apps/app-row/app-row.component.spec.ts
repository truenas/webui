import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { officialCatalog } from 'app/constants/catalog.constants';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { AppStatusCellComponent } from 'app/pages/apps/components/installed-apps/app-status-cell/app-status-cell.component';

describe('AppRowComponent', () => {
  let spectator: Spectator<AppRowComponent>;
  const app = {
    name: 'app_name',
    status: ChartReleaseStatus.Active,
    chart_metadata: { icon: 'https://image/' },
    catalog: officialCatalog,
  } as ChartRelease;

  const createComponent = createComponentFactory({
    component: AppRowComponent,
    imports: [ImgFallbackModule],
    declarations: [
      MockComponents(AppStatusCellComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { app },
    });
  });

  it('checks app logo, name and catalog', () => {
    expect(spectator.query('.app-logo img')).toHaveAttribute('src', 'https://image/');
    expect(spectator.query('.app-name')).toHaveText('app_name');
    expect(spectator.query('.app-catalog')).toHaveText('Official');
  });

  it('checks app status column', () => {
    const statusCell = spectator.query(AppStatusCellComponent);
    expect(statusCell).toBeTruthy();
    expect(statusCell.app).toBe(app);
  });

  it('checks app update column', () => {
    expect(spectator.query('.cell-update')).toHaveText('Up to date');
  });
});
