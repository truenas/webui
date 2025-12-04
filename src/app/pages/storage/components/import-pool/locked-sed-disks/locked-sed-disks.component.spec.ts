import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { SedStatus } from 'app/enums/sed-status.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { filterLockedSedDisks, LockedSedDisk } from 'app/pages/storage/components/import-pool/utils/sed-disk.utils';
import { LockedSedDisksComponent } from './locked-sed-disks.component';

describe('LockedSedDisksComponent', () => {
  let spectator: Spectator<LockedSedDisksComponent>;
  let loader: HarnessLoader;

  const lockedDisks: LockedSedDisk[] = [
    {
      name: 'ada0', model: 'Samsung 870 EVO 2TB', serial: 'S5XYNS0T123456A', size: 2000000000000,
    },
    {
      name: 'ada1', model: 'Samsung 870 EVO 2TB', serial: 'S5XYNS0T123456B', size: 2000000000000,
    },
  ];

  const createComponent = createComponentFactory({
    component: LockedSedDisksComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { lockedDisks },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('displays locked SED disks', () => {
    const diskItems = spectator.queryAll('.disk-item');
    expect(diskItems).toHaveLength(2);

    expect(spectator.query('.disk-name')).toHaveText('ada0');
    expect(spectator.query('.disk-meta')).toContainText('Samsung 870 EVO 2TB');
    expect(spectator.query('.disk-meta')).toContainText('S5XYNS0T123456A');
  });

  it('displays warning message about locked SED disks', () => {
    const warningHeader = spectator.query('.warning-header');
    expect(warningHeader).toContainText('Locked SED Disks Detected');
  });

  it('displays Locked badge for each disk', () => {
    const badges = spectator.queryAll('.status-badge');
    expect(badges).toHaveLength(2);
    expect(badges[0]).toHaveText('Locked');
    expect(badges[1]).toHaveText('Locked');
  });

  it('emits skip event when skip button is clicked', async () => {
    jest.spyOn(spectator.component.skip, 'emit');

    const skipButton = await loader.getHarness(MatButtonHarness.with({ text: 'Skip' }));
    await skipButton.click();

    expect(spectator.component.skip.emit).toHaveBeenCalled();
  });

  it('emits unlock event when unlock button is clicked', async () => {
    jest.spyOn(spectator.component.unlock, 'emit');

    const unlockButton = await loader.getHarness(MatButtonHarness.with({ text: 'Unlock' }));
    await unlockButton.click();

    expect(spectator.component.unlock.emit).toHaveBeenCalled();
  });

  describe('filterLockedSedDisks', () => {
    it('filters disks with SedStatus.Locked', () => {
      const allDisks = [
        {
          name: 'ada0', model: 'Samsung', serial: 'S123', size: 1000, sed_status: SedStatus.Locked,
        },
        {
          name: 'ada1', model: 'WD', serial: 'W456', size: 2000, sed_status: SedStatus.Unlocked,
        },
        {
          name: 'ada2', model: 'Seagate', serial: 'SEA789', size: 3000, sed_status: SedStatus.Locked,
        },
        {
          name: 'ada3', model: 'Hitachi', serial: 'H000', size: 4000,
        },
      ] as DetailsDisk[];

      const result = filterLockedSedDisks(allDisks);

      expect(result).toHaveLength(2);
      expect(result[0].name).toBe('ada0');
      expect(result[1].name).toBe('ada2');
    });

    it('returns empty array when no locked disks', () => {
      const allDisks = [
        {
          name: 'ada0', model: 'Samsung', serial: 'S123', size: 1000, sed_status: SedStatus.Unlocked,
        },
      ] as DetailsDisk[];

      const result = filterLockedSedDisks(allDisks);

      expect(result).toHaveLength(0);
    });
  });
});
