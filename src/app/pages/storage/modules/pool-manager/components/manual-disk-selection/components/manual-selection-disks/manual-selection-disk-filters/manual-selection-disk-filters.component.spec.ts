import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import {
  ManualSelectionDiskFiltersComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-disks/manual-selection-disk-filters/manual-selection-disk-filters.component';
import {
  ManualDiskSelectionStore,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';

describe('ManualSelectionDiskFiltersComponent', () => {
  let spectator: Spectator<ManualSelectionDiskFiltersComponent>;
  let loader: HarnessLoader;
  const filtersUpdated = jest.fn();
  const createComponent = createComponentFactory({
    component: ManualSelectionDiskFiltersComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(ManualDiskSelectionStore, {
        inventory$: of([
          {
            type: DiskType.Ssd,
            size: 4 * GiB,
          },
          {
            type: DiskType.Hdd,
            size: 2 * GiB,
          },
          {
            type: DiskType.Hdd,
            size: 2 * GiB,
          },
        ] as DetailsDisk[]),
      }),
    ],
  });

  function getDiskTypeSelect(): Promise<TnSelectHarness> {
    return loader.getHarness(TnSelectHarness.with({ selector: '[formControlName="diskType"]' }));
  }

  function getDiskSizeSelect(): Promise<TnSelectHarness> {
    return loader.getHarness(TnSelectHarness.with({ selector: '[formControlName="diskSize"]' }));
  }

  function getSedCheckbox(): Promise<TnCheckboxHarness> {
    return loader.getHarness(TnCheckboxHarness.with({ selector: '[formControlName="sedCapable"]' }));
  }

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.filtersUpdated.subscribe(filtersUpdated);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows search input that emits (filtersUpdated) on change', async () => {
    const search = await loader.getHarness(TnInputHarness);
    await search.setValue('S1234');

    expect(filtersUpdated).toHaveBeenCalledWith({
      search: 'S1234',
      diskType: '',
      diskSize: '',
      sedCapable: false,
    });
  });

  it('shows disk type select with available disk types', async () => {
    expect(await (await getDiskTypeSelect()).getOptions()).toEqual(['--', 'SSD', 'HDD']);
  });

  it('emits (filtersUpdated) when disk type select is changed', async () => {
    await (await getDiskTypeSelect()).selectOption('HDD');

    expect(filtersUpdated).toHaveBeenCalledWith({
      search: '',
      diskType: DiskType.Hdd,
      diskSize: '',
      sedCapable: false,
    });
  });

  it('shows disk size select with available disk sizes', async () => {
    expect(await (await getDiskSizeSelect()).getOptions()).toEqual(['--', '2 GiB', '4 GiB']);
  });

  it('emits (filtersUpdated) when disk size select is changed', async () => {
    await (await getDiskSizeSelect()).selectOption('4 GiB');

    expect(filtersUpdated).toHaveBeenCalledWith({
      search: '',
      diskType: '',
      diskSize: '4 GiB',
      sedCapable: false,
    });
  });

  it('shows SED Capable checkbox that emits (filtersUpdated) when checked', async () => {
    await (await getSedCheckbox()).check();

    expect(filtersUpdated).toHaveBeenCalledWith({
      search: '',
      diskType: '',
      diskSize: '',
      sedCapable: true,
    });
  });

  describe('when SED encryption is enabled', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          isSedEncryption: true,
        },
      });
      spectator.component.filtersUpdated.subscribe(filtersUpdated);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('checks and disables SED Capable checkbox', async () => {
      const checkbox = await getSedCheckbox();

      expect(await checkbox.isChecked()).toBe(true);
      expect(await checkbox.isDisabled()).toBe(true);
    });
  });

  describe('when SED encryption is not enabled', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: {
          isSedEncryption: false,
        },
      });
      spectator.component.filtersUpdated.subscribe(filtersUpdated);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('allows SED Capable checkbox to be changed', async () => {
      const checkbox = await getSedCheckbox();

      expect(await checkbox.isChecked()).toBe(false);
      expect(await checkbox.isDisabled()).toBe(false);
    });
  });
});
