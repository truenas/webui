import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { DiskType } from 'app/enums/disk-type.enum';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  ManualSelectionDiskFiltersComponent,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/components/manual-selection-disks/manual-selection-disk-filters/manual-selection-disk-filters.component';
import {
  ManualDiskSelectionStore,
} from 'app/pages/storage/modules/pool-manager/components/manual-disk-selection/store/manual-disk-selection.store';

describe('ManualSelectionDiskFiltersComponent', () => {
  let spectator: Spectator<ManualSelectionDiskFiltersComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
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

  beforeEach(async () => {
    spectator = createComponent();
    spectator.component.filtersUpdated.subscribe(filtersUpdated);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows search input that emits (filtersUpdated) on change', async () => {
    const search = await loader.getHarness(IxInputHarness);
    await search.setValue('S1234');

    expect(filtersUpdated).toHaveBeenCalledWith({
      search: 'S1234',
      diskType: '',
      diskSize: '',
    });
  });

  it('shows disk type select with available disk types', async () => {
    const select = await form.getControl('Filter by Disk Type') as IxSelectHarness;
    expect(await select.getOptionLabels()).toEqual(['--', 'SSD', 'HDD']);
  });

  it('emits (filtersUpdated) when disk type select is changed', async () => {
    await form.fillForm({
      'Filter by Disk Type': 'HDD',
    });

    expect(filtersUpdated).toHaveBeenCalledWith({
      search: '',
      diskType: DiskType.Hdd,
      diskSize: '',
    });
  });

  it('shows disk size select with available disk sizes', async () => {
    const select = await form.getControl('Filter by Disk Size') as IxSelectHarness;
    expect(await select.getOptionLabels()).toEqual(['--', '2 GiB', '4 GiB']);
  });

  it('emits (filtersUpdated) when disk size select is changed', async () => {
    await form.fillForm({
      'Filter by Disk Size': '4 GiB',
    });

    expect(filtersUpdated).toHaveBeenCalledWith({
      search: '',
      diskType: '',
      diskSize: '4 GiB',
    });
  });
});
