import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ApiErrorName, JsonRpcErrorCode } from 'app/enums/api.enum';
import { ApiTraceFrame } from 'app/interfaces/api-error.interface';
import { NtpServer } from 'app/interfaces/ntp-server.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { NtpServersFormComponent } from 'app/pages/system/advanced/ntp-servers/ntp-servers-form/ntp-servers-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ApiCallError } from 'app/services/errors/error.classes';

describe('NtpServerFormComponent', () => {
  let spectator: Spectator<NtpServersFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const editingNtpServer = {
    id: 1,
    address: 'mock.ntp.server',
    burst: false,
    iburst: true,
    prefer: false,
    minpoll: 6,
    maxpoll: 10,
  } as NtpServer;

  const slideInRef: SlideInRef<NtpServer | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: NtpServersFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(DialogService),
      mockApi([
        mockCall('system.ntpserver.create'),
        mockCall('system.ntpserver.update'),
      ]),
      mockProvider(SlideIn),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  describe('adding ntp server', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('sends a create payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Address: 'ua.pool.ntp.org',
        'Min Poll': 8,
        Force: true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('system.ntpserver.create', [{
        address: 'ua.pool.ntp.org',
        burst: false,
        iburst: true,
        prefer: false,
        minpoll: 8,
        maxpoll: 10,
        force: true,
      }]);
    });
  });

  describe('editing ntp server', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => editingNtpServer }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows current server values when form is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Address: 'mock.ntp.server',
        Burst: false,
        IBurst: true,
        Prefer: false,
        'Min Poll': '6',
        'Max Poll': '10',
        Force: false,
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Address: 'updated.mock.ntp.server',
        'Max Poll': 14,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('system.ntpserver.update', [
        1,
        {
          address: 'updated.mock.ntp.server',
          burst: false,
          iburst: true,
          prefer: false,
          minpoll: 6,
          maxpoll: 14,
          force: false,
        },
      ]);
    });
  });
});

/**
 * NAS-142225. Drives the reported path end to end: the backend rejects an unreachable address, the
 * message is pinned on `address`, and ticking `Force` must free Save. Uses the REAL
 * `FormErrorHandlerService` — `setup-jest` mocks it for every spec, so it is re-provided here — so
 * both the pinning and its self-retiring on the next edit are genuine rather than staged.
 */
describe('NtpServerFormComponent — Force clears the unreachable-address error', () => {
  const unreachable = new ApiCallError({
    code: JsonRpcErrorCode.CallError,
    message: 'Validation error',
    data: {
      error: 11,
      errname: ApiErrorName.Validation,
      extra: [[
        'ntp_server_create.address',
        'Server could not be reached. Check "Force" to continue regardless.',
        22,
      ]],
      trace: { class: 'ValidationErrors', formatted: '', frames: [] as ApiTraceFrame[] },
      reason: 'Test reason',
    },
  });

  let spectator: Spectator<NtpServersFormComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: NtpServersFormComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockProvider(DialogService),
      mockApi([mockCall('system.ntpserver.create')]),
      mockProvider(SlideIn),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
        getData: jest.fn((): undefined => undefined),
      }),
      mockProvider(ErrorHandlerService),
      // Overrides the blanket mock `setup-jest` installs, so the real pinning runs.
      FormErrorHandlerService,
      mockAuth(),
    ],
  });

  const isSaveDisabled = async (): Promise<boolean> => {
    return (await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))).isDisabled();
  };

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    jest.spyOn(spectator.inject(ApiService), 'call').mockReturnValue(throwError(() => unreachable));

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ Address: '192.0.2.1' });
    await (await loader.getHarness(MatButtonHarness.with({ text: 'Save' }))).click();
    spectator.detectChanges();
  });

  it('pins the backend message on the address field and blocks Save', async () => {
    expect(spectator.component.formGroup.controls.address.errors).toEqual(expect.objectContaining({
      manualValidateErrorMsg: 'Server could not be reached. Check "Force" to continue regardless.',
    }));
    expect(await isSaveDisabled()).toBe(true);
  });

  it('frees Save when Force is checked, without touching the address value', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ Force: true });
    spectator.detectChanges();

    expect(await isSaveDisabled()).toBe(false);
    expect(spectator.component.formGroup.controls.address.value).toBe('192.0.2.1');
  });

  it('still blocks Save on a live client-side error', async () => {
    // Retiring the backend's verdict frees nothing else: real validators keep their say, so a Max
    // Poll above the allowed 17 must still hold Save shut.
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ 'Max Poll': 99, Force: true });
    spectator.detectChanges();

    expect(await isSaveDisabled()).toBe(true);
  });

  it('retires the verdict on any edit, not just Force', async () => {
    // The pin describes one submitted payload, so any edit moves the payload on. `Force` is not
    // special-cased anywhere — it is simply the field the user reaches for on this form.
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({ Burst: true });
    spectator.detectChanges();

    expect(await isSaveDisabled()).toBe(false);
  });
});
