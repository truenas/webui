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

  it('displays locked SED disks with correct information', () => {
    expect(spectator.fixture.nativeElement.textContent).toContain('ada0');
    expect(spectator.fixture.nativeElement.textContent).toContain('ada1');
    expect(spectator.fixture.nativeElement.textContent).toContain('Samsung 870 EVO 2TB');
    expect(spectator.fixture.nativeElement.textContent).toContain('S5XYNS0T123456A');
    expect(spectator.fixture.nativeElement.textContent).toContain('S5XYNS0T123456B');
  });

  it('displays warning message about locked SED disks', () => {
    expect(spectator.fixture.nativeElement.textContent).toContain('Locked SED Disks Detected');
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
