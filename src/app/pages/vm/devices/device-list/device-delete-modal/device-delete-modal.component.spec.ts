import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import {
  createComponentFactory, mockProvider, Spectator, SpectatorFactory,
} from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VmDeviceType } from 'app/enums/vm.enum';
import { VmDevice, VmDiskDevice, VmRawFileDevice } from 'app/interfaces/vm-device.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  DeviceDeleteModalComponent,
} from 'app/pages/vm/devices/device-list/device-delete-modal/device-delete-modal.component';

describe('DeviceDeleteModalComponent', () => {
  let spectator: Spectator<DeviceDeleteModalComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  function createComponentWithData(device: VmDevice): SpectatorFactory<DeviceDeleteModalComponent> {
    return createComponentFactory({
      component: DeviceDeleteModalComponent,
      imports: [
        ReactiveFormsModule,
      ],
      providers: [
        mockApi([
          mockCall('vm.device.delete'),
        ]),
        mockProvider(DialogService),
        mockProvider(MatDialogRef),
        mockAuth(),
      ],
      componentProviders: [
        { provide: MAT_DIALOG_DATA, useFactory: () => device },
      ],
    });
  }

  describe('for disk', () => {
    const fakeDisk = {
      id: 4,
      attributes: {
        dtype: VmDeviceType.Disk,
        path: '/path/to/zvol123',
      },
    } as VmDiskDevice;

    const createComponent = createComponentWithData(fakeDisk);

    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    afterEach(() => {
      spectator.fixture.destroy();
    });

    describe('when opened', () => {
      it('shows initial state of checkboxes', async () => {
        const form = await loader.getHarness(IxFormHarness);
        const values = await form.getValues();

        expect(values).toEqual({
          'Delete zvol device': false,
          'Force Delete': false,
        });
      });
    });

    [
      { filledValues: { zvol: false, force: false }, expectedValues: { zvol: false, raw_file: false, force: false } },
      { filledValues: { zvol: false, force: true }, expectedValues: { zvol: false, raw_file: false, force: true } },
    ].forEach(({ filledValues, expectedValues }) => {
      describe(
        `when zvol = '${String(filledValues.zvol)}' and force = '${String(filledValues.force)}' filled and submitted`,
        () => {
          it(`sends ${JSON.stringify(expectedValues)} to websocket`, async () => {
            const form = await loader.getHarness(IxFormHarness);
            await form.fillForm({
              'Delete zvol device': filledValues.zvol,
              'Force Delete': filledValues.force,
            });

            const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete Device' }));
            await submitButton.click();

            expect(api.call).toHaveBeenCalledWith('vm.device.delete', [
              fakeDisk.id,
              expectedValues,
            ]);
          });
        },
      );
    });
  });

  describe('for raw file', () => {
    const fakeRawFile = {
      id: 5,
      attributes: {
        dtype: VmDeviceType.Raw,
      },
    } as VmRawFileDevice;

    const createComponent = createComponentWithData(fakeRawFile);

    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    afterEach(() => {
      spectator.fixture.destroy();
    });

    describe('when opened', () => {
      it('shows initial state of checkboxes', async () => {
        const form = await loader.getHarness(IxFormHarness);
        const values = await form.getValues();

        expect(values).toEqual({
          'Delete raw file': false,
          'Force Delete': false,
        });
      });
    });

    [
      {
        filledValues: { raw_file: false, force: false },
        expectedValues: { zvol: false, raw_file: false, force: false },
      },
      {
        filledValues: { raw_file: false, force: true },
        expectedValues: { zvol: false, raw_file: false, force: true },
      },
      {
        filledValues: { raw_file: true, force: false },
        expectedValues: { zvol: false, raw_file: true, force: false },
      },
      {
        filledValues: { raw_file: true, force: true },
        expectedValues: { zvol: false, raw_file: true, force: true },
      },
    ].forEach(({ filledValues, expectedValues }) => {
      describe(
        // eslint-disable-next-line jest/valid-title
        `when raw_file = '${String(filledValues.raw_file)}' `
        + `and force = '${String(filledValues.force)}' filled and submitted`,
        () => {
          it(`sends ${JSON.stringify(expectedValues)} to websocket`, async () => {
            const form = await loader.getHarness(IxFormHarness);
            await form.fillForm({
              'Delete raw file': filledValues.raw_file,
              'Force Delete': filledValues.force,
            });

            const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete Device' }));
            await submitButton.click();

            expect(api.call).toHaveBeenCalledWith('vm.device.delete', [
              fakeRawFile.id,
              expectedValues,
            ]);
          });
        },
      );
    });
  });

  describe('for other device', () => {
    const fakeRawFile = {
      id: 6,
      attributes: {
        dtype: undefined,
      },
    } as unknown as VmRawFileDevice;

    const createComponent = createComponentWithData(fakeRawFile);

    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    afterEach(() => {
      spectator.fixture.destroy();
    });

    describe('when opened', () => {
      it('shows initial state of checkboxes', async () => {
        const form = await loader.getHarness(IxFormHarness);
        const values = await form.getValues();

        expect(values).toEqual({
          'Force Delete': false,
        });
      });
    });

    [
      { filledValues: { force: false }, expectedValues: { zvol: false, raw_file: false, force: false } },
      { filledValues: { force: true }, expectedValues: { zvol: false, raw_file: false, force: true } },
    ].forEach(({ filledValues, expectedValues }) => {
      describe(`when force = '${String(filledValues.force)}' filled and submitted`, () => {
        it(`sends ${JSON.stringify(expectedValues)} to websocket`, async () => {
          const form = await loader.getHarness(IxFormHarness);
          await form.fillForm({
            'Force Delete': filledValues.force,
          });

          const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete Device' }));
          await submitButton.click();

          expect(api.call).toHaveBeenCalledWith('vm.device.delete', [
            fakeRawFile.id,
            expectedValues,
          ]);
        });
      });
    });
  });
});
