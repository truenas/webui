import { DialogRef } from '@angular/cdk/dialog';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { TnMenuHarness, TnMenuTesting, TnTreeHarness } from '@truenas/ui-components';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { TopologyItemType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { PoolInstance } from 'app/interfaces/pool.interface';
import { VDevItem } from 'app/interfaces/storage.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { BootStatusListComponent } from 'app/pages/system/bootenv/bootenv-status/bootenv-status.component';
import { BootenvNodeItemComponent } from './bootenv-node-item/bootenv-node-item.component';

const oneDisk = {
  name: 'sda3',
  type: TopologyItemType.Disk,
  path: '/dev/sda3',
  guid: '1909089035164712918',
  status: TopologyItemStatus.Online,
  stats: {
    timestamp: 65023816157559,
    read_errors: 0,
    write_errors: 0,
    checksum_errors: 0,
    size: 20401094656,
    allocated: 5607686144,
    fragmentation: 4,
  },
} as VDevItem;

const poolInstance = {
  guid: 'boot-pool',
  name: 'boot-pool',
  path: '/',
  status: PoolStatus.Online,
  size: 20401094656,
  allocated: 16723320832,
  scan: {
    end_time: {
      $date: 1643309114000,
    },
  },
  topology: {
    data: [oneDisk],
  },
} as PoolInstance;

describe('BootStatusListComponent', () => {
  let spectator: Spectator<BootStatusListComponent>;
  let loader: HarnessLoader;
  let api: MockApiService;

  const createComponent = createComponentFactory({
    component: BootStatusListComponent,
    imports: [
      FakeProgressBarComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockProvider(DialogRef),
      mockProvider(SnackbarService),
      mockApi([
        mockCall('boot.get_state', poolInstance as unknown as CallResponse<WebUiApiDirectory, 'boot.get_state'>),
        mockCall('boot.detach', null),
      ]),
    ],
    declarations: [
      FakeFormatDateTimePipe,
      BootenvNodeItemComponent,
    ],
  });

  beforeEach(() => {
    jest.spyOn(console, 'warn').mockImplementation();
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(MockApiService);
  });

  it('loads boot pool state and shows it when one disk', async () => {
    expect(api.call).toHaveBeenCalledWith('boot.get_state');

    const tree = await loader.getHarness(TnTreeHarness);
    const nodes = await tree.getNodes();
    expect(nodes).toHaveLength(2);

    const firstNodeText = await nodes[0].getText();
    expect(firstNodeText).toContain('boot-pool');
    expect(firstNodeText).toContain('Online');
    expect(firstNodeText).toContain('No Errors');

    const secondNodeText = await nodes[1].getText();
    expect(secondNodeText).toContain('sda3');
    expect(secondNodeText).toContain('Online');
    expect(secondNodeText).toContain('No Errors');
  });

  describe('mirrored boot pool', () => {
    // boot.get_state names a mirror's members by their /dev path.
    const mirroredPool = {
      ...poolInstance,
      topology: {
        data: [{
          name: 'mirror-0',
          type: TopologyItemType.Mirror,
          guid: '8047127003581040126',
          status: TopologyItemStatus.Online,
          children: [
            { ...oneDisk, name: '/dev/sda3' },
            {
              ...oneDisk, name: '/dev/sdb3', path: '/dev/sdb3', guid: '5513806441215632751',
            },
          ],
        }],
      },
    } as PoolInstance;

    beforeEach(() => {
      api.mockCall('boot.get_state', mirroredPool as unknown as CallResponse<WebUiApiDirectory, 'boot.get_state'>);
      // Detaching navigates back to the boot page; the testing router has no routes to match.
      jest.spyOn(spectator.inject(Router), 'navigate').mockResolvedValue(true);
      spectator.component.ngOnInit();
      spectator.detectChanges();
    });

    it('detaches a member disk by its partition name, without the /dev/ prefix', async () => {
      const tree = await loader.getHarness(TnTreeHarness);
      const [mirror] = await tree.getNodes({ text: /^mirror-0/ });
      await mirror.expand();

      const row = spectator.queryAll('ix-bootenv-node-item')
        .find((item) => item.querySelector('.cell-name')?.textContent?.trim() === '/dev/sdb3')!;
      spectator.click(row.querySelector('button[aria-label="Actions"]')!);

      const menu = await TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
      await menu.clickItem({ label: 'Detach' });

      expect(api.call).toHaveBeenCalledWith('boot.detach', ['sdb3']);
    });
  });
});
