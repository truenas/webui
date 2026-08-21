import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest'; // cspell:ignore ngneat
import { TranslateService } from '@ngx-translate/core';
import { TnCheckboxHarness, TnFormFieldHarness, TnInputHarness } from '@truenas/ui-components';
import { throwError } from 'rxjs';
import { provideTnFormFieldErrors } from 'app/core/providers/tn-form-field-errors.provider';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ApiErrorName, JsonRpcErrorCode } from 'app/enums/api.enum';
import { ApiTraceFrame } from 'app/interfaces/api-error.interface';
import { CreateNtpServer, NtpServer } from 'app/interfaces/ntp-server.interface';
import { FormSubmitEvent } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { IxFormRendererComponent } from 'app/modules/forms/ix-forms/components/ix-form-renderer/ix-form-renderer.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { getNtpServersFormConfig } from 'app/pages/system/advanced/ntp-servers/ntp-servers-form/ntp-servers.form-config';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ApiCallError } from 'app/services/errors/error.classes';

describe('getNtpServersFormConfig', () => {
  const allValues = {
    address: 'ua.pool.ntp.org', burst: true, iburst: false, prefer: false, minpoll: 6, maxpoll: 10, force: false,
  } as CreateNtpServer;

  const api = { call: jest.fn(() => undefined) } as unknown as ApiService;
  const translate = { instant: (key: string) => key } as TranslateService;

  beforeEach(() => jest.clearAllMocks());

  it('builds a create request when no server is being edited', () => {
    const definition = getNtpServersFormConfig(api, translate, undefined);
    definition.submit({ isEdit: false, allValues, changedValues: allValues } as FormSubmitEvent<CreateNtpServer>);

    expect(api.call).toHaveBeenCalledWith('system.ntpserver.create', [allValues]);
  });

  it('builds an update request scoped to the edited server id', () => {
    const definition = getNtpServersFormConfig(api, translate, { id: 7 } as NtpServer);
    definition.submit({ isEdit: true, allValues, changedValues: allValues } as FormSubmitEvent<CreateNtpServer>);

    expect(api.call).toHaveBeenCalledWith('system.ntpserver.update', [7, allValues]);
  });
});

/**
 * NAS-142225. Drives the reported path end to end: the backend rejects an unreachable address, the
 * message is pinned on `address`, and ticking `Force` must free Save. Uses the REAL
 * `FormErrorHandlerService` (overriding the mock from `ixFormTestingProviders`) so the pinning is
 * genuine rather than staged.
 */
describe('NTP server form — Force clears the unreachable-address error', () => {
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

  let spectator: Spectator<IxFormRendererComponent<CreateNtpServer>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IxFormRendererComponent<CreateNtpServer>,
    imports: [ReactiveFormsModule],
    providers: [
      ...ixFormTestingProviders(),
      // Wired app-wide in production; needed here for `tn-form-field` to render the pinned
      // backend message instead of the raw error key.
      provideTnFormFieldErrors(),
      FormErrorHandlerService,
      mockProvider(ErrorHandlerService),
      { provide: SlideInRef, useValue: null },
      mockAuth(),
    ],
  });

  const failSave = async (): Promise<void> => {
    await (await loader.getHarness(TnInputHarness.with({ name: 'address' }))).setValue('192.0.2.1');
    spectator.component.submit();
    spectator.detectChanges();
  };

  beforeEach(async () => {
    const rejectingApi = { call: jest.fn(() => throwError(() => unreachable)) } as unknown as ApiService;
    const definition = getNtpServersFormConfig(
      rejectingApi,
      { instant: (key: string) => key } as TranslateService,
      undefined,
    );
    // `definition` is input.required and read in ngOnInit, so it must be set before the first pass.
    spectator = createComponent({ props: { definition } });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    await failSave();
  });

  it('pins the backend message on the address field and blocks Save', async () => {
    const addressField = await loader.getHarness(TnFormFieldHarness.with({ label: 'Address' }));

    expect(await addressField.getErrorMessage())
      .toBe('Server could not be reached. Check "Force" to continue regardless.');
    expect(spectator.component.canSubmit()).toBe(false);
  });

  it('frees Save when Force is checked, without touching the address value', async () => {
    await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Force' }))).check();
    spectator.detectChanges();

    expect(spectator.component.canSubmit()).toBe(true);
    expect(await (await loader.getHarness(TnInputHarness.with({ name: 'address' }))).getValue())
      .toBe('192.0.2.1');
  });

  it('still blocks Save on a live client-side error when Force is checked', async () => {
    // Force retires the backend's verdict and nothing else: real validators keep their say, so a
    // Max Poll above the allowed 17 must still hold Save shut.
    await (await loader.getHarness(TnInputHarness.with({ name: 'maxpoll' }))).setValue('99');
    await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Force' }))).check();
    spectator.detectChanges();

    expect(spectator.component.canSubmit()).toBe(false);
  });

  it('leaves other forms alone — the checkbox only clears a pinned backend error', async () => {
    // Ticking an unrelated checkbox must NOT free Save; only `force` carries the clearing.
    await (await loader.getHarness(TnCheckboxHarness.with({ label: 'Burst' }))).check();
    spectator.detectChanges();

    expect(spectator.component.canSubmit()).toBe(false);
  });
});
