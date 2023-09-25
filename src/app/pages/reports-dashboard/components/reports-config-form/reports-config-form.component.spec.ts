import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ReportingConfig } from 'app/interfaces/reporting.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { ReportsConfigFormComponent } from './reports-config-form.component';

const mockInitialConfig = {
  graph_age: 12,
  graph_points: 1200,
} as ReportingConfig;

const mockUserConfig = {
  graph_age: 24,
  graph_points: 2048,
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
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
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
      'Graph Age in Months': '24',
      'Number of Graph Points': '2048',
    });
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
      graph_age: 18,
      graph_points: 2048,
    }]);
  });

  it('should reset user config to initial values when reset button is pressed', async () => {
    const form = await loader.getHarness(IxFormHarness);

    expect(await form.getValues()).toEqual({
      'Graph Age in Months': '24',
      'Number of Graph Points': '2048',
    });

    const resetButton = await loader.getHarness(MatButtonHarness.with({ text: 'Reset to Defaults' }));
    await resetButton.click();

    expect(await form.getValues()).toEqual({
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
