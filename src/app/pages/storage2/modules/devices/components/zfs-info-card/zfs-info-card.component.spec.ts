import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import {
  byText, createComponentFactory, Spectator, mockProvider,
} from '@ngneat/spectator/jest';
import { of, Subject } from 'rxjs';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { VDevType } from 'app/enums/v-dev-type.enum';
import { VDevStatus } from 'app/enums/vdev-status.enum';
import { Disk, VDev } from 'app/interfaces/storage.interface';
import { ConfirmDialogComponent } from 'app/modules/common/dialog/confirm-dialog/confirm-dialog.component';
import { ZfsInfoCardComponent } from 'app/pages/storage2/modules/devices/components/zfs-info-card/zfs-info-card.component';
import { DevicesStore } from 'app/pages/storage2/modules/devices/stores/devices-store.service';
import { DiskFormComponent } from 'app/pages/storage2/modules/disks/components/disk-form/disk-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('ZfsInfoCardComponent', () => {
  let spectator: Spectator<ZfsInfoCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: ZfsInfoCardComponent,
    providers: [
      mockWebsocket([
        mockCall('pool.detach'),
        mockCall('pool.remove'),
        mockCall('pool.offline'),
        mockCall('pool.online'),
      ]),
      mockProvider(IxSlideInService, {
        onClose$: new Subject<unknown>(),
        open: jest.fn(),
      }),
      mockProvider(ActivatedRoute, {
        snapshot: { params: { poolId: '1' } },
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(),
        })),
      }),
      mockProvider(DevicesStore),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        topologyItem: {
          disk: 'ix-disk-1',
          type: VDevType.Disk,
          children: [],
          status: VDevStatus.Online,
          stats: {
            read_errors: 3,
            write_errors: 2,
            checksum_errors: 1,
          },
        } as VDev,
        topologyParentItem: {
          name: 'mirror-0',
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

  it('opens slide to edit Disk when clicks Edit button', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(DiskFormComponent, { wide: true });
  });

  it('shows confirmation when clicks Remove button', async () => {
    const replaceButton = await loader.getHarness(MatButtonHarness.with({ text: 'Remove' }));
    await replaceButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ConfirmDialogComponent, {
      disableClose: false,
    });
  });

  it('shows confirmation when clicks Detach button', async () => {
    const replaceButton = await loader.getHarness(MatButtonHarness.with({ text: 'Detach' }));
    await replaceButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ConfirmDialogComponent, {
      disableClose: false,
    });
  });

  it('shows confirmation when clicks Offline button', async () => {
    const replaceButton = await loader.getHarness(MatButtonHarness.with({ text: 'Offline' }));
    await replaceButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ConfirmDialogComponent, {
      disableClose: false,
    });
  });
});
