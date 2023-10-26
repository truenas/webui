import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { officialCatalog } from 'app/constants/catalog.constants';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { ChartRelease } from 'app/interfaces/chart-release.interface';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { AppStatusCellComponent } from 'app/pages/apps/components/installed-apps/app-status-cell/app-status-cell.component';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';
import { AppCatalogPipe } from 'app/pages/apps/utils/app-catalog.pipe';

describe('AppRowComponent', () => {
  let spectator: Spectator<AppRowComponent>;
  const app = {
    name: 'app_name',
    status: ChartReleaseStatus.Active,
    chart_metadata: { icon: 'https://image/' },
    catalog: officialCatalog,
    stats: {
      cpu: 50.155,
      memory: 20,
      network: {
        incoming: 50000000,
        outgoing: 55500000,
      },
    },
  } as ChartRelease;

  const status = AppStatus.Started;

  const createComponent = createComponentFactory({
    component: AppRowComponent,
    imports: [ImgFallbackModule, AppCatalogPipe],
    declarations: [
      MockComponents(AppStatusCellComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { app, status },
    });
  });

  it('checks app logo, name and catalog', () => {
    expect(spectator.query('.app-logo img')).toHaveAttribute('src', 'https://image/');
    expect(spectator.query('.app-name')).toHaveText('app_name');
    expect(spectator.query('.app-catalog')).toHaveText('TrueNAS');
  });

  it('checks app status column', () => {
    const statusCell = spectator.query(AppStatusCellComponent);
    expect(statusCell).toBeTruthy();
    expect(statusCell.appStatus).toBe(status);
  });

  it('checks app update column', () => {
    expect(spectator.query('.cell-update')).toHaveText('Up to date');
  });

  it('checks usage columns', () => {
    expect(spectator.query('.cell-cpu')).toHaveText('50%');
    expect(spectator.query('.cell-ram')).toHaveText('20 MiB');
    expect(spectator.query('.cell-network')).toHaveText('47.68 MiB / 52.93 MiB');
  });
});
