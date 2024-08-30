import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetSettingsRef } from 'app/pages/dashboard/types/widget-settings-ref.interface';
import { WidgetPoolSettings } from 'app/pages/dashboard/widgets/storage/widget-pool/widget-pool.definition';
import { WidgetPoolSettingsComponent } from './widget-pool-settings.component';

describe('WidgetPoolSettingsComponent', () => {
  let spectator: Spectator<WidgetPoolSettingsComponent>;
  let loader: HarnessLoader;
  const settings$ = new BehaviorSubject<WidgetPoolSettings>({} as WidgetPoolSettings);

  const createComponent = createComponentFactory({
    component: WidgetPoolSettingsComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockProvider(WidgetSettingsRef, {
        getSettings: jest.fn(() => settings$),
        updateValidity: jest.fn(),
        updateSettings: jest.fn(),
      }),
      mockProvider(WidgetResourcesService, {
        pools$: of([{
          id: 1,
          name: 'Pool 1',
        }, {
          id: 2,
          name: 'Pool 2',
        }, {
          id: 3,
          name: 'Pool 3',
        }]),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks pre-select first option when no settings', async () => {
    const pool = await loader.getHarness(IxSelectHarness.with({ label: 'Pool' }));
    const selectedPool = await pool.getValue();
    expect(selectedPool).toBe('Pool 1');
  });

  it('checks pool options', async () => {
    const pool = await loader.getHarness(IxSelectHarness.with({ label: 'Pool' }));
    expect(await pool.getOptionLabels()).toEqual(['Pool 1', 'Pool 2', 'Pool 3']);
  });
});
