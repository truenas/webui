import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import helptext from 'app/helptext/services/components/service-s3';
import { Certificate } from 'app/interfaces/certificate.interface';
import { S3Config } from 'app/interfaces/s3-config.interface';
import {
  WithManageCertificatesLinkComponent,
} from 'app/modules/ix-forms/components/with-manage-certificates-link/with-manage-certificates-link.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { DialogService, SystemGeneralService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { ServiceS3Component } from './service-s3.component';

describe('ServiceS3Component', () => {
  let spectator: Spectator<ServiceS3Component>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createRoutingFactory({
    component: ServiceS3Component,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(WithManageCertificatesLinkComponent),
    ],
    providers: [
      mockWebsocket([
        mockCall('s3.config', {
          bindip: '0.0.0.0',
          bindport: 9000,
          access_key: 'AAAABBBB1',
          secret_key: '12345678',
          storage_path: '/mnt/s3/',
          browser: true,
          console_bindport: 9001,
          certificate: 2,
          tls_server_uri: 'test',
        } as S3Config),
        mockCall('s3.bindip_choices', {
          '0.0.0.0': '0.0.0.0',
          '198.162.0.10': '198.162.0.10',
        }),
        mockCall('s3.update'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SystemGeneralService, {
        getCertificates: jest.fn(() => of([
          { name: 'Default', id: 1 },
          { name: 'Very Secure', id: 2 },
        ] as Certificate[])),
      }),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => {
          return () => of([]);
        }),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('loads and shows current settings for S3 service when form is opened', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(ws.call).toHaveBeenCalledWith('s3.config');
    expect(values).toEqual({
      'Access Key': 'AAAABBBB1',
      'Enable Browser': true,
      'IP Address': '0.0.0.0',
      Port: '9000',
      Disk: '/mnt/s3/',
      'Secret Key': '12345678',
      Certificate: 'Very Secure',
      'Console Port': '9001',
      'TLS Server Hostname': 'test',
    });
  });

  it('shows a warning when "Disk" is changed', async () => {
    const dialog = spectator.inject(DialogService);

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Disk: '/mnt/new',
    });

    expect(dialog.confirm).toHaveBeenCalledWith({
      title: helptext.path_warning_title,
      message: helptext.path_warning_msg,
    });
  });

  it('sends an update payload to websocket when form is saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'IP Address': '198.162.0.10',
      Port: 8000,
      'Access Key': 'SECRETKEY',
      'Secret Key': '12345678',
      Disk: '/mnt/new',
      'Enable Browser': false,
      Certificate: 'Default',
      'Console Port': 9001,
      'TLS Server Hostname': 'test',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('s3.update', [{
      access_key: 'SECRETKEY',
      bindip: '198.162.0.10',
      bindport: 8000,
      browser: false,
      certificate: 1,
      secret_key: '12345678',
      storage_path: '/mnt/new',
      console_bindport: 9001,
      tls_server_uri: 'test',
    }]);
  });
});
