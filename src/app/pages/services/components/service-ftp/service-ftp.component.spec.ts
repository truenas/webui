import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { FtpConfig } from 'app/interfaces/ftp-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxPermissionsComponent } from 'app/modules/forms/ix-forms/components/ix-permissions/ix-permissions.component';
import {
  WithManageCertificatesLinkComponent,
} from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { ServiceFtpComponent } from 'app/pages/services/components/service-ftp/service-ftp.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { WebSocketService } from 'app/services/ws.service';

describe('ServiceFtpComponent', () => {
  let spectator: Spectator<ServiceFtpComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const existingFtpConfig = {
    anonpath: '/mnt/x',
    anonuserbw: 3145728,
    anonuserdlbw: 5120,
    banner: 'Welcome',
    clients: 5,
    defaultroot: true,
    dirmask: '755',
    filemask: '700',
    fxp: true,
    ident: true,
    ipconnections: 2,
    localuserbw: 1048576,
    localuserdlbw: 2097152,
    loginattempt: 1,
    masqaddress: '192.168.1.110',
    onlyanonymous: true,
    onlylocal: true,
    options: '--test=value',
    passiveportsmax: 12000,
    passiveportsmin: 10000,
    port: 21,
    resume: true,
    reversedns: true,
    ssltls_certificate: 1,
    timeout: 600,
    timeout_notransfer: 300,
    tls: true,
    tls_opt_allow_client_renegotiations: true,
    tls_opt_allow_dot_login: false,
    tls_opt_allow_per_user: true,
    tls_opt_common_name_required: true,
    tls_opt_dns_name_required: true,
    tls_opt_enable_diags: false,
    tls_opt_export_cert_data: true,
    tls_opt_ip_address_required: false,
    tls_opt_no_empty_fragments: false,
    tls_opt_no_session_reuse_required: false,
    tls_opt_stdenvvars: true,
    tls_policy: '!data',
  } as FtpConfig;

  const createComponent = createRoutingFactory({
    component: ServiceFtpComponent,
    imports: [
      ReactiveFormsModule,
      IxPermissionsComponent,
      WithManageCertificatesLinkComponent,
    ],
    providers: [
      mockWebSocket([
        mockCall('ftp.config', {
          ...existingFtpConfig,
          id: 1,
        }),
        mockCall('ftp.update'),
      ]),
      mockProvider(SystemGeneralService, {
        getCertificates: () => of([
          { id: 1, name: 'Secure certificate' },
        ]),
      }),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => {
          return () => of([]);
        }),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('loads and shows current settings for FTP service', async () => {
    const values = await form.getValues();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('ftp.config');
    expect(values).toEqual({
      Port: '21',
      Clients: '5',
      Connections: '2',
      'Login Attempts': '1',
      'Notransfer Timeout': '300',
      Timeout: '600',
    });
  });

  it('shows advanced options when Advanced Options button is pressed', async () => {
    const advancedOptionsButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
    await advancedOptionsButton.click();

    const values = await form.getValues();

    expect(values).toEqual({
      Port: '21',
      Clients: '5',
      Connections: '2',
      'Login Attempts': '1',
      'Notransfer Timeout': '300',
      Timeout: '600',
      Certificate: 'Secure certificate',

      'Always Chroot': true,
      'Allow Anonymous Login': true,
      Path: '/mnt/x',
      'Allow Local User Login': true,
      'Require IDENT Authentication': true,
      'File Permissions': '077',
      'Directory Permissions': '022',

      'Enable TLS': true,
      'TLS Policy': '!Data',
      'TLS Allow Client Renegotiations': true,
      'TLS Allow Dot Login': false,
      'TLS Allow Per User': true,
      'TLS Common Name Required': true,
      'TLS Enable Diagnostics': false,
      'TLS Export Certificate Data': true,
      'TLS No Empty Fragments': false,
      'TLS No Session Reuse Required': false,
      'TLS Export Standard Vars': true,
      'TLS DNS Name Required': true,
      'TLS IP Address Required': false,

      'Minimum Passive Port': '10000',
      'Maximum Passive Port': '12000',
      'Enable FXP': true,
      'Allow Transfer Resumption': true,
      'Perform Reverse DNS Lookups': true,
      'Masquerade Address': '192.168.1.110',
      'Display Login': 'Welcome',
      'Auxiliary Parameters': '--test=value',
      'Local User Upload Bandwidth: (Examples: 500 KiB, 500M, 2 TB)': '1 GiB',
      'Local User Download Bandwidth': '2 GiB',
      'Anonymous User Upload Bandwidth': '3 GiB',
      'Anonymous User Download Bandwidth': '5 MiB',
    });
  });

  it('updates config for FTP service when form is submitted', async () => {
    const advancedOptionsButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
    await advancedOptionsButton.click();

    await form.fillForm({
      'TLS IP Address Required': true,
      'Anonymous User Download Bandwidth': '5',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('ftp.update', [{
      ...existingFtpConfig,
      tls_opt_ip_address_required: true,
      anonuserdlbw: 5,
    }]);
  });

  it('does not show TLS fields when TLS is off', async () => {
    const advancedOptionsButton = await loader.getHarness(MatButtonHarness.with({ text: 'Advanced Options' }));
    await advancedOptionsButton.click();

    await form.fillForm({
      'Enable TLS': false,
    });

    const controlNames = Object.keys(await form.getControlHarnessesDict());
    expect(controlNames).not.toContainValue([
      'TLS Policy',
      'TLS Allow Client Renegotiations',
      'TLS Allow Dot Login',
      'TLS Allow Per User',
      'TLS Common Name Required',
      'TLS Enable Diagnostics',
      'TLS Export Certificate Data',
      'TLS No Empty Fragments',
      'TLS No Session Reuse Required',
      'TLS Export Standard Vars',
      'TLS DNS Name Required',
      'TLS IP Address Required',
    ]);
  });
});
