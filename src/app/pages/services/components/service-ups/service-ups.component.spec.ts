import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { UpsMode, UpsShutdownMode } from 'app/enums/ups-mode.enum';
import { UpsConfig, UpsConfigUpdate } from 'app/interfaces/ups-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxComboboxHarness } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ServiceUpsComponent } from 'app/pages/services/components/service-ups/service-ups.component';

describe('ServiceUpsComponent', () => {
  let spectator: Spectator<ServiceUpsComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createRoutingFactory({
    component: ServiceUpsComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('ups.config', {
          complete_identifier: 'ups@localhost:3',
          driver: 'bcmxcp$PW9315',
          extrausers: '',
          hostsync: 16,
          id: 1,
          identifier: 'ups',
          mode: UpsMode.Master,
          monpwd: '',
          monuser: 'upsmon',
          nocommwarntime: null,
          options: '',
          optionsupsd: '',
          port: '/dev/uhid',
          powerdown: true,
          remotehost: '',
          remoteport: 3456,
          rmonitor: true,
          shutdown: UpsShutdownMode.Battery,
          shutdowncmd: '',
          shutdowntimer: 30,
        } as UpsConfig),
        mockCall('ups.driver_choices', {
          bcmxcp$PW9315: 'Powerware ups 5 PW9315 3-phase (bcmxcp)',
          'bcmxcp$Powerware 9130': 'Eaton ups 5 Powerware 9130 (bcmxcp)',
          'bcmxcp$Powerware 9140': 'Eaton ups 5 Powerware 9140 (bcmxcp)',
          'bcmxcp$R1500 G2': 'HP ups 3 R1500 G2 Serial port (bcmxcp)',
          'bcmxcp$R3000 XR': 'Compaq ups 4 R3000 XR (bcmxcp) / HP ups 4 R3000 XR (bcmxcp)',
          'bcmxcp$R5500 XR': 'Compaq ups 4 R5500 XR (bcmxcp) / HP ups 4 R5500 XR (bcmxcp)',
          'bcmxcp$T750 G2': 'HP ups 3 T750 G2 Serial port (bcmxcp)',
        }),
        mockCall('ups.port_choices', ['/dev/uhid', 'auto']),
        mockCall('ups.update'),
      ]),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    api = spectator.inject(ApiService);
  });

  it('shows current settings for UPS service when form is opened', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(api.call).toHaveBeenCalledWith('ups.config');
    expect(values).toEqual({
      Identifier: 'ups',
      'UPS Mode': 'Master',
      Driver: 'Powerware ups 5 PW9315 3-phase (bcmxcp)',
      'Port or Hostname': '/dev/uhid',
      'Monitor User': 'upsmon',
      'Monitor Password': '',
      'Extra Users': '',
      'Remote Monitor': true,
      'Shutdown Mode': 'UPS goes on battery',
      'Shutdown Timer': '30',
      'Shutdown Command': '',
      'Power Off UPS': true,
      'No Communication Warning Time': '',
      'Host Sync': '16',
      'Auxiliary Parameters (ups.conf)': '',
      'Auxiliary Parameters (upsd.conf)': '',
    });
  });

  it('sends an update payload to websocket when form is saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      Identifier: 'ups',
      'UPS Mode': 'Master',
      Driver: 'HP ups 3 R1500 G2 Serial port (bcmxcp)',
      'Port or Hostname': 'auto',
      'Monitor User': 'upsmon',
      'Monitor Password': 'pleasechange',
      'Extra Users': '',
      'Remote Monitor': false,
      'Shutdown Mode': 'UPS goes on battery',
      'Shutdown Timer': '30',
      'Shutdown Command': '',
      'Power Off UPS': false,
      'No Communication Warning Time': '',
      'Host Sync': '16',
      'Auxiliary Parameters (ups.conf)': '',
      'Auxiliary Parameters (upsd.conf)': '',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(api.call).toHaveBeenCalledWith('ups.update', [{
      driver: 'bcmxcp$R1500 G2',
      extrausers: '',
      hostsync: 16,
      identifier: 'ups',
      mode: 'MASTER',
      monpwd: 'pleasechange',
      monuser: 'upsmon',
      nocommwarntime: null,
      options: '',
      optionsupsd: '',
      port: 'auto',
      powerdown: false,
      rmonitor: false,
      shutdown: 'BATT',
      shutdowncmd: '',
      shutdowntimer: 30,
    } as UpsConfigUpdate]);
  });

  it('allow custom values to be saved as form value for combobox', async () => {
    const form = await loader.getHarness(IxFormHarness);

    const portSelect = await loader.getHarness(IxComboboxHarness.with({ label: 'Port or Hostname' }));

    await portSelect.writeCustomValue('/my-custom-port');

    const portSelectValue = await portSelect.getValue();

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    const formValue = await form.getValues();

    expect(formValue['Port or Hostname']).toBe('/my-custom-port');
    expect(portSelectValue).toBe('/my-custom-port');
  });
});
