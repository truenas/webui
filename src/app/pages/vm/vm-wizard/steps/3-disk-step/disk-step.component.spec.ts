import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { GiB } from 'app/constants/bytes.constant';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VmDiskMode } from 'app/enums/vm.enum';
import { IxRadioGroupHarness } from 'app/modules/ix-forms/components/ix-radio-group/ix-radio-group.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { FreeSpaceValidatorService } from 'app/pages/vm/utils/free-space-validator.service';
import { DiskStepComponent, NewOrExistingDisk } from 'app/pages/vm/vm-wizard/steps/3-disk-step/disk-step.component';

describe('DiskStepComponent', () => {
  let spectator: Spectator<DiskStepComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const createComponent = createComponentFactory({
    component: DiskStepComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('pool.filesystem_choices', [
          'poolio',
          'poolio/files',
        ]),
        mockCall('vm.device.disk_choices', {
          '/dev/zvol/poolio/test-327brn': 'poolio/test-327brn',
        }),
      ]),
      mockProvider(FreeSpaceValidatorService, {
        validate: () => of(null),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  describe('create new disk image', () => {
    beforeEach(async () => {
      await form.fillForm({
        'Select Disk Type': 'AHCI',
        'Zvol Location': 'poolio',
        Size: '20 GiB',
      });
    });

    it('shows form fields', () => {
      expect(spectator.component.form.value).toEqual({
        newOrExisting: NewOrExistingDisk.New,
        hdd_type: VmDiskMode.Ahci,
        datastore: 'poolio',
        hdd_path: '',
        volsize: 20 * GiB,
      });
    });

    it('returns summary when getSummary is used', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'Disk',
          value: 'Create new disk image',
        },
        {
          label: 'Disk Description',
          value: '20 GiB AHCI at poolio',
        },
      ]);
    });
  });

  describe('use existing disk image', () => {
    beforeEach(async () => {
      const modeRadio = await loader.getHarness(IxRadioGroupHarness);
      await modeRadio.setValue('Use existing disk image');

      await form.fillForm({
        'Select Disk Type': 'VIRTIO',
        'Select Existing Zvol': 'poolio/test-327brn',
      });
    });

    it('shows form fields', () => {
      expect(spectator.component.form.value).toEqual({
        newOrExisting: NewOrExistingDisk.Existing,
        hdd_path: '/dev/zvol/poolio/test-327brn',
        hdd_type: VmDiskMode.Virtio,
        datastore: '',
        volsize: null,
      });
    });

    it('returns summary when getSummary is used', () => {
      expect(spectator.component.getSummary()).toEqual([
        {
          label: 'Disk',
          value: 'Use existing disk image',
        },
        {
          label: 'Disk Description',
          value: 'VIRTIO at /dev/zvol/poolio/test-327brn',
        },
      ]);
    });
  });
});
