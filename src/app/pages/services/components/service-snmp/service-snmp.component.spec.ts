import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TestBed } from '@angular/core/testing';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { Observable, of, throwError } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SnmpConfig } from 'app/interfaces/snmp-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormMinSubmitFeedbackMs } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ServiceSnmpComponent } from './service-snmp.component';

describe('ServiceSnmpComponent', () => {
  let spectator: Spectator<ServiceSnmpComponent>;
  let api: ApiService;
  let loader: HarnessLoader;

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const hasInput = async (name: string): Promise<boolean> => (await loader.getAllHarnesses(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  )).length > 0;
  // `api.call` is already a jest mock, so `jest.spyOn` would hand back that same instance and the
  // fall-through below would recurse — drive the mock directly instead, failing one method and
  // delegating every other call to the stubs registered above.
  const failApiCall = (apiService: ApiService, method: string): void => {
    const call = apiService.call as unknown as jest.Mock<Observable<unknown>, [string, unknown?]>;
    const respond = call.getMockImplementation() as (m: string, p?: unknown) => Observable<unknown>;
    call.mockImplementation((calledMethod, params) => (
      calledMethod === method
        ? throwError(() => new Error('Failed to load config'))
        : respond(calledMethod, params)
    ));
  };
  // `form` is protected on the IxFormHostForm base — reaching it keeps the failed-load test's
  // assertion about `loadFailed` rather than about unfilled required fields.
  const formOf = (component: ServiceSnmpComponent): FormGroup => {
    return (component as unknown as { form: FormGroup }).form;
  };

  const createComponent = createRoutingFactory({
    component: ServiceSnmpComponent,
    imports: [
      ReactiveFormsModule,
    ],
    routes: [],
    providers: [
      mockProvider(DialogService),
      mockApi([
        mockCall('snmp.update'),
        mockCall('snmp.config', {
          location: 'My location',
          contact: 'test@truenas.org',
          community: 'gated',
          v3: true,
          v3_username: 'john',
          v3_authtype: 'MD5',
          v3_password: '12345678',
          v3_privproto: 'AES',
          v3_privpassphrase: '87654321',
          options: 'leave_pidfile=true',
          zilstat: true,
        } as SnmpConfig),
      ]),
      ...ixFormTestingProviders(),
      { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    api = spectator.inject(ApiService);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('blocks Save when the initial config load fails', () => {
    expect(spectator.component.canSubmit()).toBe(true);

    const showErrorModal = jest.spyOn(spectator.inject(ErrorHandlerService), 'showErrorModal')
      .mockReturnValue(of(true));
    failApiCall(api, 'snmp.config');

    // A fresh instance rather than a second `ngOnInit()` on the one from `beforeEach`:
    // re-initialising an already-initialised form re-registers its valueChanges subscriptions,
    // so the assertion would hinge on double-init being harmless.
    const failed = TestBed.createComponent(ServiceSnmpComponent);
    failed.detectChanges();

    expect(showErrorModal).toHaveBeenCalled();
    // The form's defaults are valid, so `loadFailed` (fed to `<ix-form>`'s extraDisabled) is the
    // only thing that can be blocking Save.
    expect(formOf(failed.componentInstance).valid).toBe(true);
    expect(failed.componentInstance.canSubmit()).toBe(false);
  });

  it('loads and shows current SNMP settings', async () => {
    expect(api.call).toHaveBeenCalledWith('snmp.config');

    expect(await (await getInput('location')).getValue()).toBe('My location');
    expect(await (await getInput('contact')).getValue()).toBe('test@truenas.org');
    expect(await (await getInput('community')).getValue()).toBe('gated');

    expect(await (await getCheckbox('v3')).isChecked()).toBe(true);
    expect(await (await getInput('v3_username')).getValue()).toBe('john');
    expect(await (await getSelect('v3_authtype')).getDisplayText()).toBe('MD5');
    expect(await (await getInput('v3_password')).getValue()).toBe('12345678');
    expect(await (await getSelect('v3_privproto')).getDisplayText()).toBe('AES');
    expect(await (await getInput('v3_privpassphrase')).getValue()).toBe('87654321');

    expect(await (await getInput('options')).getValue()).toBe('leave_pidfile=true');
    expect(await (await getCheckbox('zilstat')).isChecked()).toBe(true);
  });

  it('saves SNMP settings when form is submitted', async () => {
    await (await getInput('location')).setValue('New location');
    await (await getInput('contact')).setValue('contact@truenas.org');
    await (await getInput('community')).setValue('public');

    await (await getInput('v3_username')).setValue('will');
    await (await getSelect('v3_authtype')).selectOption('SHA');
    await (await getInput('v3_password')).setValue('abcd1234');
    await (await getSelect('v3_privproto')).selectOption('DES');
    await (await getInput('v3_privpassphrase')).setValue('4321dcba');

    await (await getInput('options')).setValue('leave_pidfile=false');
    await (await getCheckbox('zilstat')).uncheck();

    spectator.component.submit();

    expect(api.call).toHaveBeenCalledWith('snmp.update', [{
      location: 'New location',
      contact: 'contact@truenas.org',
      community: 'public',

      v3: true,
      v3_username: 'will',
      v3_authtype: 'SHA',
      v3_password: 'abcd1234',
      v3_privproto: 'DES',
      v3_privpassphrase: '4321dcba',

      options: 'leave_pidfile=false',
      zilstat: false,
    }]);
  });

  it('submits an empty authentication type when the selection is cleared', async () => {
    await (await getSelect('v3_authtype')).selectOption('--');

    spectator.component.submit();

    expect(api.call).toHaveBeenCalledWith('snmp.update', [
      expect.objectContaining({ v3_authtype: '' }),
    ]);
  });

  it('does not show v3 fields if SNMP v3 Support checkbox is off', async () => {
    await (await getCheckbox('v3')).uncheck();

    expect(await hasInput('v3_username')).toBe(false);
    expect(await hasInput('v3_password')).toBe(false);
    expect(await hasInput('v3_privpassphrase')).toBe(false);

    spectator.component.submit();

    expect(api.call).toHaveBeenCalledWith('snmp.update', [
      expect.objectContaining({
        v3: false,
        v3_username: '',
        v3_authtype: '',
        v3_password: '',
        v3_privproto: null,
        v3_privpassphrase: '',
      }),
    ]);
  });
});
