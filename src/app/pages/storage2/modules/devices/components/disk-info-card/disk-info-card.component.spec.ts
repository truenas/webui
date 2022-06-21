import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import {
  byText, createComponentFactory, Spectator, mockProvider,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { Disk, VDev } from 'app/interfaces/storage.interface';
import { IxFormatterService } from 'app/modules/ix-forms/services/ix-formatter.service';
import { DiskFormComponent } from 'app/pages/storage/disks/disk-form/disk-form.component';
import { ReplaceDiskDialogComponent } from 'app/pages/storage/volumes/volume-status/components/replace-disk-dialog/replace-disk-dialog.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { DiskInfoCardComponent } from './disk-info-card.component';

describe('DiskInfoCardComponent', () => {
  let spectator: Spectator<DiskInfoCardComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: DiskInfoCardComponent,
    providers: [
      mockWebsocket([
        mockCall('disk.query', [{
          description: '',
          hddstandby: DiskStandby.AlwaysOn,
          model: 'VMware_Virtual_S',
          name: 'sda',
          rotationrate: null,
          serial: '',
          size: 10737418240,
          transfermode: 'Auto',
          type: DiskType.Hdd,
          zfs_guid: '11254578662959974657',
        } as Disk]),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(ActivatedRoute, {
        snapshot: { params: { poolId: '1' } },
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(),
        })),
      }),
      mockProvider(IxFormatterService, {
        convertBytesToHumanReadable: jest.fn(() => '10.00 GiB'),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        disk: {
          disk: 'sda',
        } as VDev,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads and shows info of the current disk', () => {
    expect(spectator.inject(WebSocketService).call)
      .toHaveBeenCalledWith('disk.query', [[['devname', '=', 'sda']]]);

    const sizeItem = spectator.query(byText('Disk Size:', { exact: true }));
    expect(sizeItem.nextElementSibling).toHaveText('10.00 GiB');

    const transfermodeItem = spectator.query(byText('Transfer Mode:', { exact: true }));
    expect(transfermodeItem.nextElementSibling).toHaveText('Auto');

    const serialItem = spectator.query(byText('Serial:', { exact: true }));
    expect(serialItem.nextElementSibling).toHaveText('');

    const modelItem = spectator.query(byText('Model:', { exact: true }));
    expect(modelItem.nextElementSibling).toHaveText('VMware_Virtual_S');

    const rotationrateItem = spectator.query(byText('Rotation Rate:', { exact: true }));
    expect(rotationrateItem.nextElementSibling).toHaveText('Not Available');

    const typeItem = spectator.query(byText('Type:', { exact: true }));
    expect(typeItem.nextElementSibling).toHaveText('HDD');

    const hddstandbyItem = spectator.query(byText('HDD Standby:', { exact: true }));
    expect(hddstandbyItem.nextElementSibling).toHaveText('ALWAYS ON');

    const descriptionItem = spectator.query(byText('Description:', { exact: true }));
    expect(descriptionItem.nextElementSibling).toHaveText('None');
  });

  it('opens slide to edit Disk when clicks Edit button', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(DiskFormComponent, { wide: true });
  });

  it('opens a ReplaceDiskDialogComponent when clicks Replace button', async () => {
    const replaceButton = await loader.getHarness(MatButtonHarness.with({ text: 'Replace' }));
    await replaceButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ReplaceDiskDialogComponent, {
      data: {
        poolId: 1,
        guid: '11254578662959974657',
        diskName: 'sda',
      },
    });
  });
});
