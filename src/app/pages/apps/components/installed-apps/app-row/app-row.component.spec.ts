import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { ImgFallbackModule } from 'ngx-img-fallback';
import { MiB } from 'app/constants/bytes.constant';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AppState } from 'app/enums/app-state.enum';
import { App } from 'app/interfaces/app.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { NetworkSpeedPipe } from 'app/modules/pipes/network-speed/network-speed.pipe';
import { AppRowComponent } from 'app/pages/apps/components/installed-apps/app-row/app-row.component';
import { AppStateCellComponent } from 'app/pages/apps/components/installed-apps/app-state-cell/app-state-cell.component';
import { AppUpdateCellComponent } from 'app/pages/apps/components/installed-apps/app-update-cell/app-update-cell.component';

describe('AppRowComponent', () => {
  let spectator: Spectator<AppRowComponent>;
  let loader: HarnessLoader;
  const app = {
    name: 'app_name',
    state: AppState.Running,
    metadata: { icon: 'https://image/' },
  } as App;

  const stats = {
    app_name: app.name,
    cpu_usage: 90,
    memory: 80 * MiB,
    networks: [{
      interface_name: 'eth0',
      rx_bytes: 256,
      tx_bytes: 512,
    }, {
      interface_name: 'eth1',
      rx_bytes: 512,
      tx_bytes: 512,
    }],
    blkio: {
      read: 1024,
      write: 2048,
    },
  };

  const createComponent = createComponentFactory({
    component: AppRowComponent,
    imports: [
      ImgFallbackModule,
      FileSizePipe,
      NetworkSpeedPipe,
    ],
    declarations: [
      MockComponents(AppStateCellComponent, AppUpdateCellComponent),
    ],
    providers: [
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        app,
        selected: false,
        stats,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows app name, logo and catalog', () => {
    expect(spectator.query('.app-logo img')).toHaveAttribute('src', 'https://image/');
    expect(spectator.query('.app-name')).toHaveText('app_name');
  });

  it('shows app state', () => {
    const statusCell = spectator.query(AppStateCellComponent);
    expect(statusCell).toBeTruthy();
  });

  it('shows app updates', () => {
    const updateCell = spectator.query(AppUpdateCellComponent);
    expect(updateCell).toBeTruthy();
    expect(updateCell.hasUpdate).toBeFalsy();
  });

  it('shows app usages stats', () => {
    expect(spectator.query('.cell-cpu')).toHaveText('90%');
    expect(spectator.query('.cell-ram')).toHaveText('80 MiB');
    expect(spectator.query('.cell-io')).toHaveText('1 KiB - 2 KiB');
    expect(spectator.query('.cell-network')).toHaveText('768 b/s - 1.02 kb/s');
  });

  describe('actions', () => {
    it('shows Stop button when app state is not Stopped', async () => {
      spectator.setInput('app', {
        ...app,
        state: AppState.Running,
      });

      const stopIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-stop-circle' }));
      const startIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-play-circle' }));
      const restartIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-restart' }));

      expect(stopIcon).toExist();
      expect(restartIcon).toExist();
      expect(startIcon).not.toExist();
    });

    it('shows Start button when app state is Stopped', async () => {
      spectator.setInput('app', {
        ...app,
        state: AppState.Stopped,
      });

      const stopIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-stop-circle' }));
      const startIcon = await loader.getHarness(IxIconHarness.with({ name: 'mdi-play-circle' }));
      const restartIcon = await loader.getHarnessOrNull(IxIconHarness.with({ name: 'mdi-restart' }));

      expect(restartIcon).not.toExist();
      expect(stopIcon).not.toExist();
      expect(startIcon).toExist();
    });
  });
});
