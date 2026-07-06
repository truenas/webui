import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { FtpConfig } from 'app/interfaces/ftp-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  ExplorerCreateDatasetComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-dataset/explorer-create-dataset.component';
import { IxPermissionsComponent } from 'app/modules/forms/ix-forms/components/ix-permissions/ix-permissions.component';
import {
  WithManageCertificatesLinkComponent,
} from 'app/modules/forms/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceFtpComponent } from 'app/pages/services/components/service-ftp/service-ftp.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('ServiceFtpComponent', () => {
  let spectator: Spectator<ServiceFtpComponent>;
  let loader: HarnessLoader;
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

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const hasSelect = async (name: string): Promise<boolean> => (await loader.getAllHarnesses(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  )).length > 0;
  const hasCheckbox = async (name: string): Promise<boolean> => (await loader.getAllHarnesses(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  )).length > 0;

  const createComponent = createRoutingFactory({
    component: ServiceFtpComponent,
    imports: [
      ReactiveFormsModule,
      IxPermissionsComponent,
      WithManageCertificatesLinkComponent,
      MockComponent(ExplorerCreateDatasetComponent),
    ],
    providers: [
      mockApi([
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
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads and shows current settings for FTP service', async () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('ftp.config');

    expect(await (await getInput('port')).getValue()).toBe('21');
    expect(await (await getInput('clients')).getValue()).toBe('5');
    expect(await (await getInput('ipconnections')).getValue()).toBe('2');
    expect(await (await getInput('loginattempt')).getValue()).toBe('1');
    expect(await (await getInput('timeout_notransfer')).getValue()).toBe('300');
    expect(await (await getInput('timeout')).getValue()).toBe('600');
  });

  it('shows advanced options when Advanced Options button is pressed', async () => {
    const advancedOptionsButton = await loader.getHarness(TnButtonHarness.with({ label: 'Advanced Options' }));
    await advancedOptionsButton.click();

    expect(await (await getSelect('ssltls_certificate')).getDisplayText()).toBe('Secure certificate');

    expect(await (await getCheckbox('defaultroot')).isChecked()).toBe(true);
    expect(await (await getCheckbox('onlyanonymous')).isChecked()).toBe(true);
    expect(await (await getCheckbox('onlylocal')).isChecked()).toBe(true);
    expect(await (await getCheckbox('ident')).isChecked()).toBe(true);

    expect(await (await getCheckbox('tls')).isChecked()).toBe(true);
    expect(await (await getSelect('tls_policy')).getDisplayText()).toBe('!Data');
    expect(await (await getCheckbox('tls_opt_allow_client_renegotiations')).isChecked()).toBe(true);
    expect(await (await getCheckbox('tls_opt_allow_dot_login')).isChecked()).toBe(false);
    expect(await (await getCheckbox('tls_opt_allow_per_user')).isChecked()).toBe(true);
    expect(await (await getCheckbox('tls_opt_common_name_required')).isChecked()).toBe(true);
    expect(await (await getCheckbox('tls_opt_enable_diags')).isChecked()).toBe(false);
    expect(await (await getCheckbox('tls_opt_export_cert_data')).isChecked()).toBe(true);
    expect(await (await getCheckbox('tls_opt_no_empty_fragments')).isChecked()).toBe(false);
    expect(await (await getCheckbox('tls_opt_no_session_reuse_required')).isChecked()).toBe(false);
    expect(await (await getCheckbox('tls_opt_stdenvvars')).isChecked()).toBe(true);
    expect(await (await getCheckbox('tls_opt_dns_name_required')).isChecked()).toBe(true);
    expect(await (await getCheckbox('tls_opt_ip_address_required')).isChecked()).toBe(false);

    expect(await (await getInput('passiveportsmin')).getValue()).toBe('10000');
    expect(await (await getInput('passiveportsmax')).getValue()).toBe('12000');
    expect(await (await getCheckbox('fxp')).isChecked()).toBe(true);
    expect(await (await getCheckbox('resume')).isChecked()).toBe(true);
    expect(await (await getCheckbox('reversedns')).isChecked()).toBe(true);
    expect(await (await getInput('masqaddress')).getValue()).toBe('192.168.1.110');
    expect(await (await getInput('banner')).getValue()).toBe('Welcome');
    expect(await (await getInput('options')).getValue()).toBe('--test=value');

    expect(await (await getInput('localuserbw')).getValue()).toBe('1 GiB');
    expect(await (await getInput('localuserdlbw')).getValue()).toBe('2 GiB');
    expect(await (await getInput('anonuserbw')).getValue()).toBe('3 GiB');
    expect(await (await getInput('anonuserdlbw')).getValue()).toBe('5 MiB');
  });

  it('updates config for FTP service when form is submitted', async () => {
    const advancedOptionsButton = await loader.getHarness(TnButtonHarness.with({ label: 'Advanced Options' }));
    await advancedOptionsButton.click();

    await (await getCheckbox('tls_opt_ip_address_required')).check();
    await (await getInput('anonuserdlbw')).setValue('5');

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('ftp.update', [{
      ...existingFtpConfig,
      tls_opt_ip_address_required: true,
      anonuserdlbw: 5,
    }]);
  });

  it('does not show TLS fields when TLS is off', async () => {
    const advancedOptionsButton = await loader.getHarness(TnButtonHarness.with({ label: 'Advanced Options' }));
    await advancedOptionsButton.click();

    await (await getCheckbox('tls')).uncheck();

    expect(await hasSelect('tls_policy')).toBe(false);
    expect(await hasCheckbox('tls_opt_allow_client_renegotiations')).toBe(false);
    expect(await hasCheckbox('tls_opt_allow_dot_login')).toBe(false);
    expect(await hasCheckbox('tls_opt_allow_per_user')).toBe(false);
    expect(await hasCheckbox('tls_opt_common_name_required')).toBe(false);
    expect(await hasCheckbox('tls_opt_enable_diags')).toBe(false);
    expect(await hasCheckbox('tls_opt_export_cert_data')).toBe(false);
    expect(await hasCheckbox('tls_opt_no_empty_fragments')).toBe(false);
    expect(await hasCheckbox('tls_opt_no_session_reuse_required')).toBe(false);
    expect(await hasCheckbox('tls_opt_stdenvvars')).toBe(false);
    expect(await hasCheckbox('tls_opt_dns_name_required')).toBe(false);
    expect(await hasCheckbox('tls_opt_ip_address_required')).toBe(false);
  });
});
