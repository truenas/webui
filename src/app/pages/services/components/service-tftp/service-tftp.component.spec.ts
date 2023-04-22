import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService, UserService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { WebSocketService } from 'app/services/ws.service';
import { ServiceTftpComponent } from './service-tftp.component';

describe('ServiceTftpComponent', () => {
  let spectator: Spectator<ServiceTftpComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createComponentFactory({
    component: ServiceTftpComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('tftp.host_choices', {
          '0.0.0.0': '0.0.0.0',
          '192.168.1.50': '192.168.1.50',
        }),
        mockCall('tftp.config', {
          id: 1,
          directory: '/mnt/x/oooo',
          host: '0.0.0.0',
          newfiles: false,
          options: 'param=true',
          port: 69,
          umask: '022',
          username: 'nobody',
        }),
        mockCall('tftp.update'),
      ]),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => {
          return () => of([]);
        }),
      }),
      mockProvider(DialogService),
      mockProvider(SnackbarService),
      mockProvider(UserService, {
        userQueryDsCache: () => of([
          { username: 'root' },
          { username: 'nobody' },
        ]),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('loads and shows current TFTP config on page load', async () => {
    const values = await form.getValues();

    expect(values).toEqual({
      Directory: '/mnt/x/oooo',
      Host: '0.0.0.0',
      Port: '69',
      Username: 'nobody',

      'File Permissions': '640',
      'Allow New Files': false,
      'Auxiliary Parameters': 'param=true',
    });
  });

  it('saves updated TFTP config when form is submitted', async () => {
    await form.fillForm({
      Username: 'root',
      Host: '192.168.1.50',
      'Allow New Files': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('tftp.update', [{
      directory: '/mnt/x/oooo',
      host: '192.168.1.50',
      newfiles: true,
      options: 'param=true',
      port: 69,
      umask: '022',
      username: 'root',
    }]);
  });
});
