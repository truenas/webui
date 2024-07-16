import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { officialCatalog } from 'app/constants/catalog.constants';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ChartReleaseStatus } from 'app/enums/chart-release-status.enum';
import { ChartRelease, ChartReleaseStats } from 'app/interfaces/chart-release.interface';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { AppStatusCellComponent } from 'app/pages/apps/components/installed-apps/app-status-cell/app-status-cell.component';
import { AppUpdateCellComponent } from 'app/pages/apps/components/installed-apps/app-update-cell/app-update-cell.component';
import { AppStatus } from 'app/pages/apps/enum/app-status.enum';

describe('AppRowComponent', () => {
  let spectator: Spectator<AppRowComponent>;
  const app = {
    name: 'app_name',
    status: ChartReleaseStatus.Active,
    chart_metadata: { icon: 'https://image/' },
    catalog: officialCatalog,
  } as ChartRelease;

  const stats = {
    cpu: 50.155,
    memory: 20000000,
    network: {
      incoming: 50000000,
      outgoing: 55500000,
    },
  } as ChartReleaseStats;

  const status = AppStatus.Started;

  const createComponent = createComponentFactory({
    component: AppRowComponent,
    imports: [
      ImgFallbackModule,
      FileSizePipe,
      NetworkSpeedPipe,
    ],
    declarations: [
      MockComponents(AppStatusCellComponent, AppUpdateCellComponent),
    ],
    providers: [
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { app, status, stats },
    });
  });

  it('shows app name, logo and catalog', () => {
    expect(spectator.query('.app-logo img')).toHaveAttribute('src', 'https://image/');
    expect(spectator.query('.app-name')).toHaveText('app_name');
  });

  it('shows app status', () => {
    const statusCell = spectator.query(AppStatusCellComponent);
    expect(statusCell).toBeTruthy();
  });

  it('shows app updates', () => {
    const updateCell = spectator.query(AppUpdateCellComponent);
    expect(updateCell).toBeTruthy();
    expect(updateCell.hasUpdate).toBeFalsy();
  });

  it('shows app usages statistics', () => {
    expect(spectator.query('.cell-cpu')).toHaveText('50%');
    expect(spectator.query('.cell-ram')).toHaveText('19.07 MiB');
    expect(spectator.query('.cell-network')).toHaveText('50 Mb/s - 55.5 Mb/s');
  });
});
