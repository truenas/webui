import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  DiskErrorsDialogComponent,
  DiskErrorsDialogData,
} from 'app/pages/storage/components/dashboard-pool/storage-health-card/disk-errors-dialog/disk-errors-dialog.component';

describe('DiskErrorsDialogComponent', () => {
  let spectator: Spectator<DiskErrorsDialogComponent>;
  let loader: HarnessLoader;

  const mockData: DiskErrorsDialogData = {
    poolId: 42,
    poolName: 'tank',
    disks: [
      {
        guid: '123456789',
        name: '/dev/sda',
        kind: 'physical',
        errorCount: {
          read: 5,
          write: 3,
          checksum: 2,
        },
      },
      {
        guid: '987654321',
        name: '/dev/sdb',
        kind: 'physical',
        errorCount: {
          read: 0,
          write: 10,
          checksum: 1,
        },
      },
    ],
  };

  const createComponent = createComponentFactory({
    component: DiskErrorsDialogComponent,
    providers: [
      {
        provide: MAT_DIALOG_DATA,
        useValue: mockData,
      },
      mockProvider(MatDialogRef),
      mockProvider(Router),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows dialog title with pool name', () => {
    const title = spectator.query('h1');
    expect(title).toHaveText('Disk Errors in tank');
  });

  it('displays all disks with errors', () => {
    const diskItems = spectator.queryAll('.disk-error-item');
    expect(diskItems).toHaveLength(2);
  });

  it('shows disk name for each errored disk', () => {
    const diskNames = spectator.queryAll('.disk-path');
    expect(diskNames[0]).toHaveText('/dev/sda');
    expect(diskNames[1]).toHaveText('/dev/sdb');
  });

  it('shows error counts for each disk', () => {
    const errorCounts = spectator.queryAll('.error-count');
    expect(errorCounts[0]).toHaveText('Read errors: 5, write errors: 3, checksum errors: 2');
    expect(errorCounts[1]).toHaveText('Read errors: 0, write errors: 10, checksum errors: 1');
  });

  it('navigates to disk detail page when View Disk is clicked', () => {
    const router = spectator.inject(Router);
    const navigateSpy = jest.spyOn(router, 'navigate');

    const viewDiskLinks = spectator.queryAll('.disk-link');
    spectator.click(viewDiskLinks[0]);

    expect(navigateSpy).toHaveBeenCalledWith(['/storage', '42', 'vdevs', '123456789']);
    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalled();
  });

  it('closes dialog when Close button is clicked', async () => {
    const closeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Close' }));
    await closeButton.click();

    expect(spectator.inject(MatDialogRef).close).toHaveBeenCalledWith(false);
  });
});
