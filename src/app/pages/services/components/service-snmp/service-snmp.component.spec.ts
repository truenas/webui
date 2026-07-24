import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SnmpConfig } from 'app/interfaces/snmp-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormMinSubmitFeedbackMs } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
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
          loglevel: 4,
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
    expect(await (await getSelect('loglevel')).getDisplayText()).toBe('Warning');
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
    await (await getSelect('loglevel')).selectOption('Error');

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
      loglevel: 3,
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
