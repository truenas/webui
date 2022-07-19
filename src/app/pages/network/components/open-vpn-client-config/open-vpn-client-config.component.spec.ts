import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { OpenVpnDeviceType } from 'app/enums/open-vpn-device-type.enum';
import { OpenvpnClientConfig } from 'app/interfaces/openvpn-client-config.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import {
  DownloadClientConfigModalComponent,
} from 'app/pages/network/components/download-client-config-modal/download-client-config-modal.component';
import { OpenVpnClientConfigComponent } from 'app/pages/network/components/open-vpn-client-config/open-vpn-client-config.component';
import {
  DialogService, ServicesService, StorageService, WebSocketService,
} from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('OpenVpnClientConfigComponent', () => {
  let spectator: Spectator<OpenVpnClientConfigComponent>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: OpenVpnClientConfigComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      AppLoaderModule,
    ],
    providers: [
      DialogService,
      mockWebsocket([
        mockCall('openvpn.client.update'),
        mockCall('openvpn.client.config', {
          client_certificate: 1,
          root_ca: 1,
          remote: '198.51.100.0',
          port: 700,
          authentication_algorithm: 'BRKD-15',
          cipher: 'AES-256-CBC',
          compression: 'LZO',
          protocol: 'UDP4',
          device_type: OpenVpnDeviceType.Tun,
          nobind: true,
          tls_crypt_auth_enabled: true,
          additional_parameters: 'param=value',
          tls_crypt_auth: 'Key 1',
        } as OpenvpnClientConfig),
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
        getOpenVpnClientAuthAlgorithmChoices: () => of({
          'BRKD-15': '113 bit digest size',
          MD99: '99 bit digest size',
        }),
        getOpenVpnClientCipherChoices: () => of({
          'AES-256-CBC': '(256 bit key, 128 bit block)',
          'AES-256-CFB': '(128 bit key, 128 bit block)',
        }),
        renewStaticKey: jest.fn(() => of({
          id: 12,
          compression: 'LZO',
          tls_crypt_auth: 'New Key',
        } as OpenvpnClientConfig)),
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

  it('loads and shows current OpenVPN client config', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('openvpn.client.config');
    expect(values).toEqual({
      'Client Certificate': 'Certificate 1',
      'Root CA': 'Main CA',
      Remote: '198.51.100.0',
      Port: '700',
      'Authentication Algorithm': 'BRKD-15 (113 bit digest size)',
      Cipher: 'AES-256-CBC (256 bit key, 128 bit block)',
      Compression: 'LZO',
      Protocol: 'UDP4',
      'Device Type': 'TUN',
      Nobind: true,
      'TLS Crypt Auth Enabled': true,
      'Additional Parameters': 'param=value',
      'TLS Crypt Auth': 'Key 1',
    });
  });

  it('saves updated config when form is submitted', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Client Certificate': 'Certificate 2',
      'Root CA': 'Shady CA',
      Remote: '198.51.100.1',
      Port: '7000',
      'Authentication Algorithm': 'MD99 (99 bit digest size)',
      Cipher: 'AES-256-CFB (128 bit key, 128 bit block)',
      Compression: 'LZ4',
      Protocol: 'UDP6',
      Nobind: false,
      'TLS Crypt Auth Enabled': false,
      'Additional Parameters': 'param=newvalue',
      'TLS Crypt Auth': 'Key 2',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('openvpn.client.update', [{
      client_certificate: 2,
      root_ca: 2,
      remote: '198.51.100.1',
      port: 7000,
      authentication_algorithm: 'MD99',
      cipher: 'AES-256-CFB',
      compression: 'LZ4',
      protocol: 'UDP6',
      device_type: OpenVpnDeviceType.Tun,
      nobind: false,
      tls_crypt_auth_enabled: false,
      additional_parameters: 'param=newvalue',
      tls_crypt_auth: 'Key 2',
    }]);
    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });
});
