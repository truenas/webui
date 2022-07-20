import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { OpenVpnDeviceType } from 'app/enums/open-vpn-device-type.enum';
import { OpenvpnServerConfig } from 'app/interfaces/openvpn-server-config.interface';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxTextareaHarness } from 'app/modules/ix-forms/components/ix-textarea/ix-textarea.harness';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import {
  DownloadClientConfigModalComponent,
} from 'app/pages/network/components/download-client-config-modal/download-client-config-modal.component';
import {
  DialogService, ServicesService, StorageService, WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { OpenVpnServerConfigComponent } from './open-vpn-server-config.component';

describe('OpenVpnServerConfigComponent', () => {
  let spectator: Spectator<OpenVpnServerConfigComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: OpenVpnServerConfigComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      AppLoaderModule,
    ],
    providers: [
      DialogService,
      mockWebsocket([
        mockCall('openvpn.server.update'),
        mockCall('openvpn.server.config', {
          server_certificate: 1,
          root_ca: 1,
          server: '198.51.100.0',
          netmask: 24,
          port: 700,
          authentication_algorithm: 'BRKD-15',
          cipher: 'AES-256-CBC',
          compression: 'LZO',
          protocol: 'UDP4',
          device_type: OpenVpnDeviceType.Tun,
          topology: 'NET30',
          tls_crypt_auth_enabled: true,
          additional_parameters: 'param=value',
          tls_crypt_auth: 'Key 1',
        } as OpenvpnServerConfig),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(ServicesService, {
        getCerts: () => of([
          { id: 1, name: 'Certificate 1' },
          { id: 2, name: 'Certificate 2' },
        ]),
        getCertificateAuthorities: () => of([
          { id: 1, name: 'Main CA' },
          { id: 2, name: 'Shady CA' },
        ]),
        getOpenVpnServerAuthAlgorithmChoices: () => of({
          'BRKD-15': '113 bit digest size',
          MD99: '99 bit digest size',
        }),
        getOpenServerCipherChoices: () => of({
          'AES-256-CBC': '(256 bit key, 128 bit block)',
          'AES-256-CFB': '(128 bit key, 128 bit block)',
        }),
        renewStaticKey: jest.fn(() => of({
          id: 12,
          compression: 'LZO',
          tls_crypt_auth: 'New Key',
        } as OpenvpnServerConfig)),
      }),
      mockProvider(StorageService, {
        downloadBlob: jest.fn(),
      }),
    ],
    declarations: [
      DownloadClientConfigModalComponent,
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('loads and shows current OpenVPN server config', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('openvpn.server.config');
    expect(values).toEqual({
      'Server Certificate': 'Certificate 1',
      'Root CA': 'Main CA',
      Server: '198.51.100.0/24',
      Port: '700',
      'Authentication Algorithm': 'BRKD-15 (113 bit digest size)',
      Cipher: 'AES-256-CBC (256 bit key, 128 bit block)',
      Compression: 'LZO',
      Protocol: 'UDP4',

      'Device Type': 'TUN',
      Topology: 'NET30',
      'TLS Crypt Auth Enabled': true,
      'Additional Parameters': 'param=value',
      'TLS Crypt Auth': 'Key 1',
    });
  });

  it('saves updated config when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Server Certificate': 'Certificate 2',
      'Root CA': 'Shady CA',
      Server: '198.51.100.0/25',
      Port: '7000',
      'Authentication Algorithm': 'MD99 (99 bit digest size)',
      Cipher: 'AES-256-CFB (128 bit key, 128 bit block)',
      Compression: 'LZ4',
      Protocol: 'UDP6',

      Topology: 'SUBNET',
      'TLS Crypt Auth Enabled': false,
      'Additional Parameters': 'param=newvalue',
      'TLS Crypt Auth': 'Key 2',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('openvpn.server.update', [{
      server_certificate: 2,
      root_ca: 2,
      server: '198.51.100.0',
      netmask: 25,
      port: 7000,
      authentication_algorithm: 'MD99',
      cipher: 'AES-256-CFB',
      compression: 'LZ4',
      protocol: 'UDP6',

      device_type: OpenVpnDeviceType.Tun,
      topology: 'SUBNET',
      tls_crypt_auth_enabled: false,
      additional_parameters: 'param=newvalue',
      tls_crypt_auth: 'Key 2',
    }]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });

  it('disables Topology field when Device Type is set to TAP', async () => {
    const deviceTypeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Device Type' }));
    await deviceTypeSelect.setValue('TAP');

    const topologySelect = await loader.getHarness(IxSelectHarness.with({ label: 'Topology' }));
    expect(await topologySelect.isDisabled()).toEqual(true);
  });

  it('renews static key, downloads it and updates TLS Crypt Auth field when Renew Static Key is pressed', async () => {
    const renewKeyButton = await loader.getHarness(MatButtonHarness.with({ text: 'Renew Static Key' }));
    await renewKeyButton.click();

    expect(spectator.inject(ServicesService).renewStaticKey).toHaveBeenCalled();
    expect(spectator.inject(StorageService).downloadText).toHaveBeenCalledWith(
      `id: 12
compression: LZO
tls_crypt_auth: New Key`,
      'openVPNStatic.key',
    );

    const tlsCryptAuth = await loader.getHarness(IxTextareaHarness.with({ label: 'TLS Crypt Auth' }));
    expect(await tlsCryptAuth.getValue()).toEqual('New Key');
  });

  it('opens Download Client Config modal when button with the same name is pressed', async () => {
    const dialog = spectator.inject(MatDialog);
    jest.spyOn(dialog, 'open');

    const downloadConfigButton = await loader.getHarness(MatButtonHarness.with({ text: 'Download Client Config' }));
    await downloadConfigButton.click();

    expect(dialog.open).toHaveBeenCalledWith(DownloadClientConfigModalComponent);
  });
});
