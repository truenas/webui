import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createRoutingFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnAutocompleteHarness, TnButtonHarness, TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { UpsMode, UpsShutdownMode } from 'app/enums/ups-mode.enum';
import { UpsConfig, UpsConfigUpdate } from 'app/interfaces/ups-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
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

  const getInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getSelect = (name: string): Promise<TnSelectHarness> => loader.getHarness(
    TnSelectHarness.with({ selector: `[formControlName="${name}"]` }),
  );
  const getCheckbox = (name: string): Promise<TnCheckboxHarness> => loader.getHarness(
    TnCheckboxHarness.with({ selector: `[formControlName="${name}"]` }),
  );

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
    expect(api.call).toHaveBeenCalledWith('ups.config');

    expect(await (await getInput('identifier')).getValue()).toBe('ups');
    expect(await (await getSelect('mode')).getDisplayText()).toBe('Master');

    const driver = await loader.getHarness(TnAutocompleteHarness.with({ selector: '[formControlName="driver"]' }));
    expect(await driver.getInputValue()).toBe('Powerware ups 5 PW9315 3-phase (bcmxcp)');

    const port = await loader.getHarness(TnAutocompleteHarness.with({ selector: '[formControlName="port"]' }));
    expect(await port.getInputValue()).toBe('/dev/uhid');

    expect(await (await getInput('monuser')).getValue()).toBe('upsmon');
    expect(await (await getInput('monpwd')).getValue()).toBe('');
    expect(await (await getInput('extrausers')).getValue()).toBe('');
    expect(await (await getCheckbox('rmonitor')).isChecked()).toBe(true);

    expect(await (await getSelect('shutdown')).getDisplayText()).toBe('UPS goes on battery');
    expect(await (await getInput('shutdowntimer')).getValue()).toBe('30');
    expect(await (await getInput('shutdowncmd')).getValue()).toBe('');
    expect(await (await getCheckbox('powerdown')).isChecked()).toBe(true);

    expect(await (await getInput('nocommwarntime')).getValue()).toBe('');
    expect(await (await getInput('hostsync')).getValue()).toBe('16');
    expect(await (await getInput('options')).getValue()).toBe('');
    expect(await (await getInput('optionsupsd')).getValue()).toBe('');
  });

  it('sends an update payload to websocket when form is saved', async () => {
    await (await getInput('identifier')).setValue('ups');
    await (await getSelect('mode')).selectOption('Master');

    const driver = await loader.getHarness(TnAutocompleteHarness.with({ selector: '[formControlName="driver"]' }));
    await driver.setInputValue('R1500');
    await driver.selectOption('HP ups 3 R1500 G2 Serial port (bcmxcp)');

    const port = await loader.getHarness(TnAutocompleteHarness.with({ selector: '[formControlName="port"]' }));
    await port.setInputValue('auto');
    await port.selectOption('auto');

    await (await getInput('monuser')).setValue('upsmon');
    await (await getInput('monpwd')).setValue('pleasechange');
    await (await getCheckbox('rmonitor')).uncheck();

    await (await getSelect('shutdown')).selectOption('UPS goes on battery');
    await (await getCheckbox('powerdown')).uncheck();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
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

  it('allow custom values to be saved as form value for the port autocomplete', async () => {
    const port = await loader.getHarness(TnAutocompleteHarness.with({ selector: '[formControlName="port"]' }));

    await port.setInputValue('/my-custom-port');
    await port.blur();

    const portValue = await port.getInputValue();

    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();

    expect(portValue).toBe('/my-custom-port');
    expect(api.call).toHaveBeenCalledWith('ups.update', [
      expect.objectContaining({ port: '/my-custom-port' }) as UpsConfigUpdate,
    ]);
  });
});
