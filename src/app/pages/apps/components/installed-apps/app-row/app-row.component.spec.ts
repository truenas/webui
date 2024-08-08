import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CatalogAppState } from 'app/enums/catalog-app-state.enum';
import { App } from 'app/interfaces/app.interface';
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
    state: CatalogAppState.Running,
    metadata: { icon: 'https://image/' },
  } as App;

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
      props: {
        app,
        status,
        selected: false,
      },
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

  // TODO: https://ixsystems.atlassian.net/browse/NAS-130471
  it.skip('shows app usages statistics', () => {
    expect(spectator.query('.cell-cpu')).toHaveText('50%');
    expect(spectator.query('.cell-ram')).toHaveText('19.07 MiB');
    expect(spectator.query('.cell-network')).toHaveText('50 Mb/s - 55.5 Mb/s');
  });
});
