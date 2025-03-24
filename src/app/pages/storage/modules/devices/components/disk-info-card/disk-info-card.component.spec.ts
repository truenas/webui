import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { ActivatedRoute } from '@angular/router';
import {
  byText, createComponentFactory, Spectator, mockProvider,
} from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DiskStandby } from 'app/enums/disk-standby.enum';
import { DiskType } from 'app/enums/disk-type.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { TopologyDisk } from 'app/interfaces/storage.interface';
import { CopyButtonComponent } from 'app/modules/buttons/copy-button/copy-button.component';
import { FileSizePipe } from 'app/modules/pipes/file-size/file-size.pipe';
import { OrNotAvailablePipe } from 'app/modules/pipes/or-not-available/or-not-available.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ReplaceDiskDialogComponent } from 'app/pages/storage/modules/devices/components/disk-info-card/replace-disk-dialog/replace-disk-dialog.component';
import { DevicesStore } from 'app/pages/storage/modules/devices/stores/devices-store.service';
import { DiskFormComponent } from 'app/pages/storage/modules/disks/components/disk-form/disk-form.component';
import { DiskInfoCardComponent } from './disk-info-card.component';

describe('DiskInfoCardComponent', () => {
  let spectator: Spectator<DiskInfoCardComponent>;
  let loader: HarnessLoader;

  const disk = {
    description: '',
    hddstandby: DiskStandby.AlwaysOn,
    model: 'VMware_Virtual_S',
    name: 'sda',
    serial: 'ABCD1',
    size: 10737418240,
    transfermode: 'Auto',
    type: DiskType.Hdd,
    zfs_guid: '11254578662959974657',
  } as Disk;

  const createComponent = createComponentFactory({
    component: DiskInfoCardComponent,
    imports: [
      FileSizePipe,
      OrNotAvailablePipe,
    ],
    declarations: [
      MockComponents(CopyButtonComponent),
    ],
    providers: [
      mockAuth(),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
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
        disk,
        topologyDisk: {
          guid: '11254578662959974657',
        } as TopologyDisk,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows info of the current disk', () => {
    const sizeItem = spectator.query(byText('Disk Size:', { exact: true }))!;
    expect(sizeItem.nextElementSibling).toHaveText('10 GiB');

    const transfermodeItem = spectator.query(byText('Transfer Mode:', { exact: true }))!;
    expect(transfermodeItem.nextElementSibling).toHaveText('Auto');

    const serialItem = spectator.query(byText('Serial:', { exact: true }))!;
    expect(serialItem.nextElementSibling).toHaveText('ABCD1');

    const modelItem = spectator.query(byText('Model:', { exact: true }))!;
    expect(modelItem.nextElementSibling).toHaveText('VMware_Virtual_S');

    const rotationrateItem = spectator.query(byText('Rotation Rate:', { exact: true }))!;
    expect(rotationrateItem.nextElementSibling).toHaveText('N/A');

    const typeItem = spectator.query(byText('Type:', { exact: true }))!;
    expect(typeItem.nextElementSibling).toHaveText('HDD');

    const hddstandbyItem = spectator.query(byText('HDD Standby:', { exact: true }))!;
    expect(hddstandbyItem.nextElementSibling).toHaveText('ALWAYS ON');

    const descriptionItem = spectator.query(byText('Description:', { exact: true }))!;
    expect(descriptionItem.nextElementSibling).toHaveText('N/A');
  });

  it('opens slide to edit Disk when clicks Edit button', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(DiskFormComponent, { data: disk });
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
