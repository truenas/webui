import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  SnmpTrapServiceComponent,
} from 'app/pages/system/alert-service/alert-service/alert-services/snmp-trap-service/snmp-trap-service.component';

describe('SnmpTrapServiceComponent', () => {
  let spectator: Spectator<SnmpTrapServiceComponent>;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: SnmpTrapServiceComponent,
    imports: [
      ReactiveFormsModule,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    form = await TestbedHarnessEnvironment.harnessForFixture(spectator.fixture, IxFormHarness);
  });

  describe('non v3 security model', () => {
    it('renders a form with alert service values', async () => {
      spectator.component.form.patchValue({
        host: 'hostname.com',
        port: 162,
        v3: false,
        community: 'public',
      });

      const values = await form.getValues();
      expect(values).toEqual({
        Hostname: 'hostname.com',
        Port: '162',
        'SNMP Community': 'public',
        'SNMPv3 Security Model': false,
      });
    });

    it('returns alert service form values when getSubmitAttributes is called', async () => {
      await form.fillForm({
        Hostname: 'newname.com',
        Port: 163,
        'SNMP Community': 'my-community',
        'SNMPv3 Security Model': false,
      });

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

      const values = await form.getValues();
      expect(values).toEqual({
        Hostname: 'hostname.com',
        Port: '162',
        'SNMPv3 Security Model': true,
        'SNMP Community': 'public',
        'Encryption Protocol': 'CFB128-AES-128',
        'Secret Authentication Key': 'authkey1',
        'Secret Encryption Key': 'encryptionkey1',
        'Authentication Protocol': 'MD5',
        Username: 'john',
      });
    });

    it('returns alert service form values when getSubmitAttributes is called', async () => {
      await form.fillForm(
        {
          Hostname: 'truenas.com',
          Port: 163,
          'SNMPv3 Security Model': true,
          'SNMP Community': 'my-community',
          'Encryption Protocol': 'DES',
          'Secret Authentication Key': 'authkey2',
          'Secret Encryption Key': 'encryptionkey2',
          'Authentication Protocol': 'SHA',
          Username: 'eve',
        },
      );

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
