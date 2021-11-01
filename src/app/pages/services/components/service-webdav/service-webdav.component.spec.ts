import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Observable, of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { WebdavConfig } from 'app/interfaces/webdav-config.interface';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/pages/common/ix-forms/testing/ix-form.harness';
import { ServiceWebdavComponent } from 'app/pages/services/components/service-webdav/service-webdav.component';
import {
  AppLoaderService, DialogService, SystemGeneralService, WebSocketService,
} from 'app/services';

describe('ServiceWebdavComponent', () => {
  let spectator: Spectator<ServiceWebdavComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: ServiceWebdavComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('webdav.config', {
          protocol: 'HTTPHTTPS',
          tcpport: 8080,
          tcpportssl: 8081,
          certssl: 1,
          htauth: 'BASIC',
          password: 'pleasechange',
          id: 1,
        } as WebdavConfig),
        mockCall('kerberos.update'),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(SystemGeneralService, {
        getCertificates(): Observable<Certificate[]> {
          return of([
            {
              CA_type_existing: false,
              CA_type_intermediate: false,
              CA_type_internal: false,
              CSR: null,
              DN: '/C=US/O=iXsystems/CN=localhost/emailAddress=info@ixsystems.com/ST=Tennessee/L=Maryville/subjectAltName=DNS:localhost',
              can_be_revoked: false,
              cert_type: 'CERTIFICATE',
              cert_type_CSR: false,
              cert_type_existing: true,
              cert_type_internal: false,
              certificate: '-----BEGIN CERTIFICATE-----\nMIID....XlGxqmLs\n-----END CERTIFICATE-----\n',
              certificate_path: '/etc/certificates/freenas_default.crt',
              chain: false,
              chain_list: ['-----BEGIN CERTIFICATE-----\nMIIDrTCCApWgAwIBAgIECg…DoVkBf/Sh1NB2cXlGxqmLs\n-----END CERTIFICATE-----\n'],
              city: 'Maryville',
              common: 'localhost',
              country: 'US',
              csr_path: '/etc/certificates/freenas_default.csr',
              digest_algorithm: 'SHA256',
              email: 'info@ixsystems.com',
              extensions: { SubjectAltName: 'DNS:localhost', ExtendedKeyUsage: 'TLS Web Server Authentication' },
              fingerprint: '88:0D:D0:12:BC:47:47:96:05:6A:8E:B8:C3:86:E5:6B:5B:E8:E9:1C',
              from: 'Fri Oct 29 14:11:19 2021',
              id: 1,
              internal: 'NO',
              issuer: 'external',
              key_length: 2048,
              key_type: 'RSA',
              lifetime: 397,
              name: 'freenas_default',
              organization: 'iXsystems',
              organizational_unit: null,
              parsed: true,
              privatekey: '-----BEGIN PRIVATE KEY-----\nMIIE....URCL/n\nH9Vn5+0sIJoZ5pZMg/H9RMWdYg==\n-----END PRIVATE KEY-----\n',
              privatekey_path: '/etc/certificates/freenas_default.key',
              revoked: false,
              revoked_date: null,
              root_path: '/etc/certificates',
              san: ['DNS:localhost'],
              serial: 168294129,
              signedby: null,
              state: 'Tennessee',
              subject_name_hash: 3193428416,
              type: 8,
              until: 'Wed Nov 30 13:11:19 2022',
            },
          ]);
        },
      }),
      mockProvider(AppLoaderService),
      mockProvider(DialogService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('loads current webdav config and show them', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(ws.call).toHaveBeenCalledWith('webdav.config');
    expect(values).toEqual({
      Protocol: 'HTTP+HTTPS',
      'HTTP Port': '8080',
      'HTTPS Port': '8081',
      'Webdav SSL Certificate': 'freenas_default',
      'HTTP Authentication': 'Basic Authentication',
      'Webdav Password': 'pleasechange',
      'Confirm Password': '',
    });
  });

  it('sends an update payload to websocket when settings are updated and saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Protocol: 'HTTP+HTTPS',
      'HTTP Port': '8000',
      'HTTPS Port': '8001',
      'Webdav SSL Certificate': 'freenas_default',
      'HTTP Authentication': 'Digest Authentication',
      'Webdav Password': 'oh, got it',
      'Confirm Password': 'oh, got it',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('webdav.update', [{
      protocol: 'HTTPHTTPS',
      tcpport: '8000',
      tcpportssl: '8001',
      certssl: 1,
      htauth: 'DIGEST',
      password: 'oh, got it',
    }]);
  });
});
