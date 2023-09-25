import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import {
  createComponentFactory, mockProvider, Spectator, SpectatorFactory,
} from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VmDeviceType } from 'app/enums/vm.enum';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { DeviceDeleteModalComponent, DeviceDeleteModalState } from 'app/pages/vm/devices/device-list/device-delete-modal/device-delete-modal.component';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';

describe('DeviceDeleteModalComponent', () => {
  let spectator: Spectator<DeviceDeleteModalComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  function createComponentWithData(data: DeviceDeleteModalState): SpectatorFactory<DeviceDeleteModalComponent> {
    return createComponentFactory({
      component: DeviceDeleteModalComponent,
      imports: [
        IxFormsModule,
        ReactiveFormsModule,
      ],
      providers: [
        mockWebsocket([
          mockCall('vm.device.delete'),
        ]),
        mockProvider(AppLoaderService),
        mockProvider(DialogService),
        mockProvider(MatDialogRef),
      ],
      componentProviders: [
        { provide: MAT_DIALOG_DATA, useFactory: () => data },
      ],
    });
  }

  describe('for disk', () => {
    const fakeDisk = {
      row: {
        id: 'id',
        dtype: VmDeviceType.Disk,
        attributes: { path: '/path/to/zvol123' },
      } as unknown,
    } as DeviceDeleteModalState;

    const createComponent = createComponentWithData(fakeDisk);

    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
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
        // eslint-disable-next-line jest/valid-title
        `when zvol = '${String(filledValues.zvol)}' and `
         + `force = '${String(filledValues.force)}' filled and submitted`,
        () => {
          it(`sends ${JSON.stringify(expectedValues)} to websocket`, async () => {
            const form = await loader.getHarness(IxFormHarness);
            await form.fillForm({
              'Delete zvol device': filledValues.zvol,
              'Force Delete': filledValues.force,
            });

            const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete Device' }));
            await submitButton.click();

            expect(ws.call).toHaveBeenCalledWith('vm.device.delete', [
              fakeDisk.row.id,
              expectedValues,
            ]);
          });
        },
      );
    });
  });

  describe('for raw file', () => {
    const fakeRawFile = {
      row: {
        id: 'id',
        dtype: VmDeviceType.Raw,
      } as unknown,
    } as DeviceDeleteModalState;

    const createComponent = createComponentWithData(fakeRawFile);

    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
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

            expect(ws.call).toHaveBeenCalledWith('vm.device.delete', [
              fakeRawFile.row.id,
              expectedValues,
            ]);
          });
        },
      );
    });
  });

  describe('for other device', () => {
    const fakeRawFile = {
      row: {
        id: 'id',
        dtype: undefined,
      } as unknown,
    } as DeviceDeleteModalState;

    const createComponent = createComponentWithData(fakeRawFile);

    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
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

          expect(ws.call).toHaveBeenCalledWith('vm.device.delete', [
            fakeRawFile.row.id,
            expectedValues,
          ]);
        });
      });
    });
  });
});
