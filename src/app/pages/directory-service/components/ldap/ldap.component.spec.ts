import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { helptextLdap } from 'app/helptext/directory-service/ldap';
import { KerberosRealm } from 'app/interfaces/kerberos-realm.interface';
import { LdapConfig } from 'app/interfaces/ldap-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  WithManageCertificatesLinkComponent,
} from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { LdapComponent } from 'app/pages/directory-service/components/ldap/ldap.component';
import { SlideInService } from 'app/services/slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';

describe('LdapComponent', () => {
  let spectator: Spectator<LdapComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const existingLdapConfig = {
    hostname: ['ldap.truenas.com', 'ldap.freenas.org'],
    basedn: 'dc=test,dc=org',
    binddn: 'cn=Manager,dc=test',
    bindpw: '12345678',
    enable: true,
    anonbind: false,
    ssl: 'START_TLS',
    certificate: 1,
    validate_certificates: true,
    disable_freenas_cache: true,
    kerberos_realm: 1,
    kerberos_principal: 'principal1',
    timeout: 10,
    dns_timeout: 15,
    auxiliary_parameters: 'param=25',
    schema: 'RFC2307',
  } as LdapConfig;

  const createComponent = createComponentFactory({
    component: LdapComponent,
    imports: [
      ReactiveFormsModule,
      WithManageCertificatesLinkComponent,
    ],
    providers: [
      mockWebSocket([
        mockJob('ldap.update', fakeSuccessfulJob()),
        mockCall('ldap.config', existingLdapConfig),
        mockCall('kerberos.keytab.kerberos_principal_choices', [
          'principal1', 'principal2',
        ]),
        mockCall('ldap.ssl_choices', ['OFF', 'START_TLS']),
        mockCall('ldap.schema_choices', ['RFC2307', 'RFC2307BIS']),
        mockCall('kerberos.realm.query', [
          { id: 1, realm: 'Realm 1' },
          { id: 2, realm: 'Realm 2' },
        ] as KerberosRealm[]),
      ]),
      mockProvider(SlideInService),
      mockProvider(SystemGeneralService, {
        refreshDirServicesCache: jest.fn(() => of(null)),
        getCertificates: () => of([
          { id: 1, name: 'certificate1' },
          { id: 2, name: 'certificate2' },
        ]),
      }),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({}),
        })),
      }),
      mockProvider(SnackbarService),
      mockProvider(SlideInRef),
      mockAuth(),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('loads LDAP config and shows it', async () => {
    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('ldap.config');

    const values = await form.getValues();
    expect(values).toEqual({
      Hostname: ['ldap.truenas.com', 'ldap.freenas.org'],
      'Base DN': 'dc=test,dc=org',
      'Bind DN': 'cn=Manager,dc=test',
      'Bind Password': '12345678',
      Enable: true,
    });
  });

  it('shows advanced LDAP when Advanced Mode is pressed', async () => {
    const advancedModeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
    await advancedModeButton.click();

    const values = await form.getValues();
    expect(values).toEqual({
      Hostname: ['ldap.truenas.com', 'ldap.freenas.org'],
      'Base DN': 'dc=test,dc=org',
      'Bind DN': 'cn=Manager,dc=test',
      'Bind Password': '12345678',
      Enable: true,

      'Allow Anonymous Binding': false,
      'Encryption Mode': 'START_TLS',
      Certificate: 'certificate1',
      'Validate Certificates': true,
      'Disable LDAP User/Group Cache': true,

      'Kerberos Realm': 'Realm 1',
      'Kerberos Principal': 'principal1',
      'LDAP Timeout': '10',
      'DNS Timeout': '15',
      'Auxiliary Parameters': 'param=25',
      Schema: 'RFC2307',
    });
  });

  it('rebuilds cache when Rebuild Cache button is pressed', async () => {
    const rebuildCacheButton = await loader.getHarness(MatButtonHarness.with({ text: 'Rebuild Directory Service Cache' }));
    await rebuildCacheButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
      helptextLdap.ldap_custactions_clearcache_dialog_message,
    );
  });

  it('saves LDAP config when form is submitted', async () => {
    const advancedModeButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
    await advancedModeButton.click();

    await form.fillForm({
      'Bind Password': 'adminadmin',
      'Allow Anonymous Binding': true,
      'Kerberos Principal': 'principal2',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith(
      'ldap.update',
      [{
        ...existingLdapConfig,
        bindpw: 'adminadmin',
        anonbind: true,
        kerberos_principal: 'principal2',
      }],
    );
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
  });
});
