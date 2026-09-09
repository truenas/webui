import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import {
  createHostFactory,
  mockProvider,
  SpectatorHost,
} from '@ngneat/spectator/jest';
import { TnAutocompleteHarness, TnCheckboxHarness } from '@truenas/ui-components';
import { BehaviorSubject } from 'rxjs';
import { TiB } from 'app/constants/bytes.constant';
import { DetailsDisk } from 'app/interfaces/disk.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { UnusedDiskSelectComponent } from 'app/modules/forms/custom-selects/unused-disk-select/unused-disk-select.component';
import { TnFormControlHarness } from 'app/modules/forms/ix-forms/testing/tn-form-control.harness';
import { ApiService } from 'app/modules/websocket/api.service';

describe('UnusedDiskSelectComponent', () => {
  let spectator: SpectatorHost<UnusedDiskSelectComponent>;
  let loader: HarnessLoader;
  let autocomplete: TnAutocompleteHarness;
  let formControl: FormControl<string | null>;
  const diskDetails = {
    unused: [
      {
        name: 'da0',
        size: 2 * TiB,
        devname: 'da0',
        identifier: '{disk}ABCD',
      },
      {
        name: 'exp1',
        size: 10 * TiB,
        devname: 'exp1',
        exported_zpool: 'old-pool',
      } as DetailsDisk,
    ] as DetailsDisk[],
    used: [
      {
        name: 'da1',
        size: 20 * TiB,
        devname: 'da1',
        exported_zpool: 'pool',
        identifier: '{disk}FGHJ',
      },
    ],
  };

  const mockCall$ = new BehaviorSubject(diskDetails);

  const createHost = createHostFactory({
    component: UnusedDiskSelectComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(ApiService, {
        call: () => mockCall$,
      }),
      mockProvider(DialogService),
    ],
  });

  beforeEach(async () => {
    formControl = new FormControl('');
    spectator = createHost(
      `<ix-unused-disk-select
        [formControl]="formControl"
        [label]="label"
        [required]="required"
        [tooltip]="tooltip"
        [diskFilteringFn]="diskFilteringFn"
        [valueField]="valueField"
      ></ix-unused-disk-select>`,
      {
        hostProps: {
          formControl,
          label: 'Select Disk',
          required: true,
          tooltip: 'Select a disk',
          diskFilteringFn: undefined,
          valueField: 'name',
        },
      },
    );
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    autocomplete = await loader.getHarness(TnAutocompleteHarness);
  });

  it('loads and shows an autocomplete with unused disks', async () => {
    await autocomplete.focus();
    const options = await autocomplete.getOptions();
    expect(options).toEqual([
      'da0 (2 TiB)',
      'da1 (20 TiB) (pool)',
      'exp1 (10 TiB) (old-pool)',
    ]);
  });

  it('writes disk name in value in formControl by default', async () => {
    await autocomplete.selectOption('da1 (20 TiB) (pool)');

    expect(formControl.value).toBe('da1');
  });

  it('writes another value from unused disk in formControl when valueField is used', async () => {
    spectator.setHostInput('valueField', 'identifier');
    await autocomplete.selectOption('da1 (20 TiB) (pool)');

    expect(formControl.value).toBe('{disk}FGHJ');
  });

  it('shows label, required flag and tooltip', async () => {
    const field = await loader.getHarness(TnFormControlHarness.with({ label: 'Select Disk' }));

    expect(await field.getLabelText()).toBe('Select Disk');
    expect(await field.isRequired()).toBe(true);
    expect(await field.getTooltip()).toBe('Select a disk');
  });

  it('uses diskFilteringFn when it is supplied', async () => {
    spectator.setHostInput('diskFilteringFn', (disk: DetailsDisk) => disk.devname === 'da1');

    await autocomplete.focus();
    const options = await autocomplete.getOptions();
    expect(options).toEqual([
      'da1 (20 TiB) (pool)',
    ]);
  });

  it('shows warning when user selects disk with exported pool', async () => {
    await autocomplete.selectOption('exp1 (10 TiB) (old-pool)');

    expect(spectator.inject(DialogService).warn).toHaveBeenCalledWith(
      'Warning: exp1',
      expect.stringContaining("This disk is part of the exported pool 'old-pool'."),
    );
  });

  describe('non-unique serialed disks', () => {
    beforeEach(() => {
      mockCall$.next({
        unused: [
          ...diskDetails.unused,
          {
            name: 'dupe1',
            size: 5 * TiB,
            devname: 'dupe1',
            duplicate_serial: ['dupe2'],
          },
        ] as DetailsDisk[],
        used: [...diskDetails.used],
      });
    });

    it('does not show disks with non-unique serials by default', async () => {
      await autocomplete.focus();
      const options = await autocomplete.getOptions();
      expect(options).toEqual([
        'da0 (2 TiB)',
        'da1 (20 TiB) (pool)',
        'exp1 (10 TiB) (old-pool)',
      ]);
    });

    it('shows extra "Allow non-unique serialed disks" if user has such disks', async () => {
      const allowCheckbox = await loader.getHarness(
        TnCheckboxHarness.with({ label: 'Allow non-unique serialed disks (not recommended)' }),
      );
      expect(allowCheckbox).toBeTruthy();
      expect(await allowCheckbox.isChecked()).toBe(false);
    });

    it('shows non-unique serialed disks when "Allow non-unique serialed disks" is checked', async () => {
      const allowCheckbox = await loader.getHarness(
        TnCheckboxHarness.with({ label: 'Allow non-unique serialed disks (not recommended)' }),
      );
      await allowCheckbox.check();

      await autocomplete.focus();
      const options = await autocomplete.getOptions();
      expect(options).toEqual([
        'da0 (2 TiB)',
        'da1 (20 TiB) (pool)',
        'dupe1 (5 TiB)',
        'exp1 (10 TiB) (old-pool)',
      ]);
    });
  });
});
