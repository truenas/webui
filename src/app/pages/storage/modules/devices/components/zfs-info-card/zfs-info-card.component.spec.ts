import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import {
  byText, createComponentFactory, Spectator, mockProvider,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { TopologyItemType, VdevType } from 'app/enums/v-dev-type.enum';
import { TopologyItemStatus } from 'app/enums/vdev-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import {
  TopologyDisk, VDev,
} from 'app/interfaces/storage.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ExtendDialogComponent,
} from 'app/pages/storage/modules/devices/components/zfs-info-card/extend-dialog/extend-dialog.component';
import { ZfsInfoCardComponent } from 'app/pages/storage/modules/devices/components/zfs-info-card/zfs-info-card.component';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';

describe('ZfsInfoCardComponent', () => {
  let spectator: Spectator<ZfsInfoCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ZfsInfoCardComponent,
    providers: [
      mockApi([
        mockCall('pool.detach'),
        mockCall('pool.offline'),
        mockCall('pool.online'),
        mockJob('pool.remove'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(),
        })),
      }),
      mockProvider(DevicesStore, {
        reloadList: jest.fn(),
      }),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        poolId: 1,
        topologyItem: {
          disk: 'ix-disk-1',
          type: TopologyItemType.Disk,
          guid: 'disk-guid',
          children: [],
          status: TopologyItemStatus.Online,
          stats: {
            read_errors: 3,
            write_errors: 2,
            checksum_errors: 1,
          },
        } as TopologyDisk,
        topologyParentItem: {
          name: 'mirror-0',
          type: TopologyItemType.Mirror,
        } as VDev,
        disk: {
          description: '',
          hddstandby: DiskStandby.AlwaysOn,
          model: 'VMware_Virtual_S',
          name: 'sda',
          rotationrate: null,
          serial: 'ABCD1',
          size: 10737418240,
          transfermode: 'Auto',
          type: DiskType.Hdd,
          zfs_guid: '11254578662959974657',
        } as Disk,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('disks', () => {
    it('shows errors of the current disk', () => {
      const parent = spectator.query(byText('Parent:', { exact: true }));
      expect(parent.nextElementSibling).toHaveText('MIRROR-0');

      const readErrors = spectator.query(byText('Read Errors:', { exact: true }));
      expect(readErrors.nextElementSibling).toHaveText('3');

      const writeErrors = spectator.query(byText('Write Errors:', { exact: true }));
      expect(writeErrors.nextElementSibling).toHaveText('2');

      const checksumErrors = spectator.query(byText('Checksum Errors:', { exact: true }));
      expect(checksumErrors.nextElementSibling).toHaveText('1');
    });

    // TODO: https://ixsystems.atlassian.net/browse/NAS-117094
    it('removes device with confirmation when Remove button is pressed', async () => {
      spectator.setInput('topologyParentItem', {
        name: 'mirror-0',
        type: TopologyItemType.Spare,
      } as VDev);
      const removeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Remove' }));
      await removeButton.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.remove', [1, { label: 'disk-guid' }]);
      expect(spectator.inject(DevicesStore).reloadList).toHaveBeenCalled();
    });

    it('shows remove button for Spare, Cache, and Log topology with RAIDZ parent', async () => {
      spectator.setInput('topologyParentItem', {
        name: 'mirror-0',
        type: TopologyItemType.Spare,
      } as VDev);
      spectator.setInput('hasTopLevelRaidz', true);
      spectator.setInput('topologyCategory', VdevType.Log);

      spectator.detectChanges();
      expect(
        await loader.getHarness(MatButtonHarness.with({ text: 'Remove' })),
      ).toBeTruthy();

      spectator.setInput('topologyCategory', VdevType.Spare);
      spectator.detectChanges();
      expect(
        await loader.getHarness(MatButtonHarness.with({ text: 'Remove' })),
      ).toBeTruthy();

      spectator.setInput('topologyCategory', VdevType.Cache);
      spectator.detectChanges();
      expect(
        await loader.getHarness(MatButtonHarness.with({ text: 'Remove' })),
      ).toBeTruthy();
    });

    it('detaches a device with confirmation when Detach is pressed', async () => {
      const detachButton = await loader.getHarness(MatButtonHarness.with({ text: 'Detach' }));
      await detachButton.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.detach', [1, { label: 'disk-guid' }]);
    });

    it('offlines a device with confirmation when Offline is pressed', async () => {
      const offlineButton = await loader.getHarness(MatButtonHarness.with({ text: 'Offline' }));
      await offlineButton.click();

      expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('pool.offline', [1, { label: 'disk-guid' }]);
    });
  });

  describe('vdev', () => {
    beforeEach(() => {
      spectator.setInput({
        poolId: 1,
        topologyItem: {
          name: 'mirror-1',
          type: TopologyItemType.Mirror,
          path: null,
          guid: '1296356085009973566',
          stats: {
            timestamp: 336344468118275,
            read_errors: 1,
            write_errors: 2,
            checksum_errors: 3,
          },
          children: [],
        } as VDev,
      });
    });

    it('shows error summary for a vdev', () => {
      const readErrors = spectator.query(byText('Read Errors:', { exact: true }));
      expect(readErrors.nextElementSibling).toHaveText('1');

      const writeErrors = spectator.query(byText('Write Errors:', { exact: true }));
      expect(writeErrors.nextElementSibling).toHaveText('2');

      const checksumErrors = spectator.query(byText('Checksum Errors:', { exact: true }));
      expect(checksumErrors.nextElementSibling).toHaveText('3');
    });

    it('opens an expand dialog when Extend is pressed on a Mirror', async () => {
      const expandButton = await loader.getHarness(MatButtonHarness.with({ text: 'Extend' }));
      await expandButton.click();

      expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ExtendDialogComponent, {
        data: {
          poolId: 1,
          targetVdevGuid: '1296356085009973566',
        },
      });
    });
  });
});
