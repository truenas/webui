import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Observable, of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { WebdavConfig, WebdavProtocol } from 'app/interfaces/webdav-config.interface';
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
          protocol: WebdavProtocol.HttpHttps,
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
        getCertificates(): Observable<Pick<Certificate, 'id' | 'name'>[]> {
          return of([
            {
              id: 1,
              name: 'freenas_default',
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
      protocol: WebdavProtocol.HttpHttps,
      tcpport: '8000',
      tcpportssl: '8001',
      certssl: 1,
      htauth: 'DIGEST',
      password: 'oh, got it',
    }]);
  });
});
