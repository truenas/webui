import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ReportingConfig } from 'app/interfaces/reporting.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { DialogService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ReportsConfigFormComponent } from './reports-config-form.component';

const mockInitialConfig = {
  cpu_in_percentage: false,
  graph_age: 12,
  graph_points: 1200,
  graphite: '',
  graphite_separateinstances: false,
} as ReportingConfig;

const mockUserConfig = {
  cpu_in_percentage: true,
  graph_age: 24,
  graph_points: 2048,
  graphite: '127.0.0.1',
  graphite_separateinstances: true,
} as ReportingConfig;

describe('ReportsConfigFormComponent', () => {
  let spectator: Spectator<ReportsConfigFormComponent>;
  let loader: HarnessLoader;
  let ws: MockWebsocketService;

  const createComponent = createComponentFactory({
    component: ReportsConfigFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('reporting.config', mockUserConfig),
        mockCall('reporting.update'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(MockWebsocketService);
  });

  it('loads and shows current reporting config', async () => {
    const form = await loader.getHarness(IxFormHarness);
    const values = await form.getValues();

    expect(ws.call).toHaveBeenCalledWith('reporting.config');
    expect(values).toEqual({
      'Report CPU usage in percent': true,
      'Graphite Separate Instances': true,
      'Remote Graphite Server Hostname': '127.0.0.1',
      'Graph Age in Months': '24',
      'Number of Graph Points': '2048',
    });
  });

  it('updates reporting config and refreshes settings when form is saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Remote Graphite Server Hostname': 'localhost',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(ws.call).toHaveBeenCalledWith('reporting.update', [{
      ...mockUserConfig,
      graphite: 'localhost',
    }]);
  });

  it('should warn user about clearing report history when it is required form is saved', async () => {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Graph Age in Months': 18,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Change Settings and Clear Report History?',
      }),
    );
    expect(ws.call).toHaveBeenLastCalledWith('reporting.update', [{
      confirm_rrd_destroy: true,
      cpu_in_percentage: true,
      graph_age: 18,
      graph_points: 2048,
      graphite: '127.0.0.1',
      graphite_separateinstances: true,
    }]);
  });

  it('should reset user config to initial values when reset button is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);

    expect(await form.getValues()).toEqual({
      'Report CPU usage in percent': true,
      'Graphite Separate Instances': true,
      'Remote Graphite Server Hostname': '127.0.0.1',
      'Graph Age in Months': '24',
      'Number of Graph Points': '2048',
    });

    const resetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Reset to Defaults' }));
    await resetButton.click();

    expect(await form.getValues()).toEqual({
      'Report CPU usage in percent': false,
      'Graphite Separate Instances': false,
      'Remote Graphite Server Hostname': '',
      'Graph Age in Months': '12',
      'Number of Graph Points': '1200',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Change Settings and Clear Report History?',
      }),
    );

    expect(ws.call).toHaveBeenLastCalledWith('reporting.update', [{
      ...mockInitialConfig,
      confirm_rrd_destroy: true,
    }]);
  });
});
