import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnCheckboxHarness, TnInputHarness, TnSelectHarness } from '@truenas/ui-components';
import {
  SnmpTrapServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/snmp-trap-service/snmp-trap-service.component';

describe('SnmpTrapServiceComponent', () => {
  let spectator: Spectator<SnmpTrapServiceComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SnmpTrapServiceComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('non v3 security model', () => {
    it('renders a form with alert service values', async () => {
      spectator.component.form.patchValue({
        host: 'hostname.com',
        port: 162,
        v3: false,
        community: 'public',
      });

      expect(await (await getInput('host')).getValue()).toBe('hostname.com');
      expect(await (await getInput('port')).getValue()).toBe('162');
      expect(await (await getInput('community')).getValue()).toBe('public');
      expect(await (await getCheckbox('v3')).isChecked()).toBe(false);
    });

    it('returns alert service form values when getSubmitAttributes is called', async () => {
      await (await getInput('host')).setValue('newname.com');
      await (await getInput('port')).setValue('163');
      await (await getInput('community')).setValue('my-community');
      await (await getCheckbox('v3')).uncheck();

      const submittedValues = spectator.component.getSubmitAttributes();
      expect(submittedValues).toEqual({
        host: 'newname.com',
        port: 163,
        community: 'my-community',
        v3: false,
      });
    });
  });

  describe('v3 security model', () => {
    it('renders a form with alert service values', async () => {
      spectator.component.form.patchValue({
        host: 'hostname.com',
        port: 162,
        v3: true,
        community: 'public',
        v3_username: 'john',
        v3_authkey: 'authkey1',
        v3_privkey: 'encryptionkey1',
        v3_authprotocol: 'MD5',
        v3_privprotocol: 'AESCFB128',
      });
      spectator.detectChanges();

      expect(await (await getInput('host')).getValue()).toBe('hostname.com');
      expect(await (await getInput('port')).getValue()).toBe('162');
      expect(await (await getInput('community')).getValue()).toBe('public');
      expect(await (await getCheckbox('v3')).isChecked()).toBe(true);
      expect(await (await getInput('v3_username')).getValue()).toBe('john');
      expect(await (await getInput('v3_authkey')).getValue()).toBe('authkey1');
      expect(await (await getInput('v3_privkey')).getValue()).toBe('encryptionkey1');
      expect(await (await getSelect('v3_authprotocol')).getDisplayText()).toBe('MD5');
      expect(await (await getSelect('v3_privprotocol')).getDisplayText()).toBe('CFB128-AES-128');
    });

    it('returns alert service form values when getSubmitAttributes is called', async () => {
      await (await getInput('host')).setValue('truenas.com');
      await (await getInput('port')).setValue('163');
      await (await getInput('community')).setValue('my-community');
      await (await getCheckbox('v3')).check();

      await (await getInput('v3_username')).setValue('eve');
      await (await getInput('v3_authkey')).setValue('authkey2');
      await (await getInput('v3_privkey')).setValue('encryptionkey2');
      await (await getSelect('v3_authprotocol')).selectOption('SHA');
      await (await getSelect('v3_privprotocol')).selectOption('DES');

      const submittedValues = spectator.component.getSubmitAttributes();
      expect(submittedValues).toEqual({
        community: 'my-community',
        host: 'truenas.com',
        port: 163,
        v3: true,
        v3_authkey: 'authkey2',
        v3_authprotocol: 'SHA',
        v3_privkey: 'encryptionkey2',
        v3_privprotocol: 'DES',
        v3_username: 'eve',
      });
    });
  });
});
