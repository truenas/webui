import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ServiceName } from 'app/enums/service-name.enum';
import { IscsiGlobalConfig } from 'app/interfaces/iscsi-global-config.interface';
import { Service } from 'app/interfaces/service.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { TargetGlobalConfigurationComponent } from './target-global-configuration.component';

describe('TargetGlobalConfigurationComponent', () => {
  let spectator: Spectator<TargetGlobalConfigurationComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;

  const createComponent = createComponentFactory({
    component: TargetGlobalConfigurationComponent,
    imports: [
      ReactiveFormsModule,
      IxFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('iscsi.global.config', {
          basename: 'iqn.2005-10.org.freenas.ctl',
          isns_servers: ['188.23.4.23', '92.233.1.1'],
          pool_avail_threshold: 20,
          listen_port: 3260,
        } as IscsiGlobalConfig),
        mockCall('iscsi.global.update'),
        mockCall('service.query', [{
          service: ServiceName.Iscsi,
          enable: true,
        } as Service]),
        mockCall('service.update'),
        mockCall('service.start'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SnackbarService),
      provideMockStore({
        selectors: [
          {
            selector: selectIsHaLicensed,
            value: true,
          },
        ],
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  it('loads iSCSI global config when component is initialized', () => {
    expect(ws.call).toHaveBeenCalledWith('iscsi.global.config');
  });

  it('shows current values for iSCSI global settings', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const formValues = await form.getValues();

    expect(formValues).toEqual({
      'Base Name': 'iqn.2005-10.org.freenas.ctl',
      'ISNS Servers': ['188.23.4.23', '92.233.1.1'],
      'Pool Available Space Threshold (%)': '20',
      'iSCSI listen port': '3260',
      'Asymmetric Logical Unit Access (ALUA)': false,
    });
  });

  it('saves form values when Save is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Base Name': 'iqn.new.org.freenas.ctl',
      'ISNS Servers': ['32.12.112.42', '8.2.1.2'],
      'Pool Available Space Threshold (%)': '15',
      'iSCSI listen port': '3270',
      'Asymmetric Logical Unit Access (ALUA)': false,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('iscsi.global.update', [{
      basename: 'iqn.new.org.freenas.ctl',
      isns_servers: ['32.12.112.42', '8.2.1.2'],
      pool_avail_threshold: 15,
      listen_port: 3270,
      alua: false,
    }]);
  });

  it('checks if iSCSI service is enabled and does nothing if it is', async () => {
    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('service.query');
    expect(spectator.inject(DialogService).confirm).not.toHaveBeenCalled();
  });

  it('if iSCSI service is not running, asks user if service needs to be enabled', async () => {
    const websocketMock = spectator.inject(MockWebsocketService);
    websocketMock.mockCall('service.query', [{
      id: 13,
      service: ServiceName.Iscsi,
      enable: false,
    } as Service]);

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(ws.call).toHaveBeenCalledWith('service.update', [13, { enable: true }]);
    expect(ws.call).toHaveBeenCalledWith('service.start', [ServiceName.Iscsi, { silent: false }]);
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
  });
});
