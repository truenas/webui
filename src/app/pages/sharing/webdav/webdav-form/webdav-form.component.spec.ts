import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { Service } from 'app/interfaces/service.interface';
import { WebDavShare } from 'app/interfaces/web-dav-share.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { AppLoaderService, DialogService, WebSocketService } from 'app/services';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebdavFormComponent } from './webdav-form.component';

describe('WebdavFormComponent', () => {
  let spectator: Spectator<WebdavFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  let form: IxFormHarness;

  const existingWebdav = {
    comment: 'This is test',
    enabled: true,
    id: 1,
    locked: false,
    name: 'test',
    path: '/mnt/test',
    perm: false,
    ro: true,
  } as WebDavShare;

  const createComponent = createComponentFactory({
    component: WebdavFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('sharing.webdav.create'),
        mockCall('sharing.webdav.update'),
        mockCall('service.query', [{
          id: 7,
          service: ServiceName.WebDav,
          enable: false,
        } as Service]),
        mockCall('service.update'),
        mockCall('service.start'),
      ]),
      mockProvider(AppLoaderService),
      mockProvider(FilesystemService),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SnackbarService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
    form = await loader.getHarness(IxFormHarness);
  });

  it('shows existing values when webdav form is opened to edit existing record', async () => {
    spectator.component.setWebdavForEdit(existingWebdav);
    const values = await form.getValues();

    expect(values).toEqual({
      Name: 'test',
      Description: 'This is test',
      Path: '/mnt/test',
      'Read Only': true,
      'Change User & Group Ownership': false,
      Enabled: true,
    });
  });

  it('edits an existing webdav entry with warning when it is open for editing', async () => {
    spectator.component.setWebdavForEdit(existingWebdav);

    await form.fillForm({
      Description: 'This is edit test',
      'Read Only': false,
      'Change User & Group Ownership': true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'WARNING',
      }),
    );

    expect(ws.call).toHaveBeenCalledWith('sharing.webdav.update', [1, {
      comment: 'This is edit test',
      enabled: true,
      name: 'test',
      path: '/mnt/test',
      perm: true,
      ro: false,
    }]);
  });

  it('adds a new webdav entry, and enable webdav service', async () => {
    await form.fillForm({
      Name: 'test01',
      Description: 'This is test01',
      Path: '/mnt/test',
      'Read Only': false,
      'Change User & Group Ownership': false,
      Enabled: true,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('sharing.webdav.create', [{
      comment: 'This is test01',
      enabled: true,
      name: 'test01',
      path: '/mnt/test',
      perm: false,
      ro: false,
    }]);

    expect(ws.call).toHaveBeenCalledWith('service.query', [[]]);

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Enable service',
      }),
    );

    expect(ws.call).toHaveBeenCalledWith('service.update', [7, { enable: true }]);
    expect(ws.call).toHaveBeenCalledWith('service.start', [ServiceName.WebDav, { silent: false }]);

    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith(
      'The WebDAV service has been enabled.',
    );

    expect(spectator.inject(IxSlideInService).close).toHaveBeenCalled();
  });
});
