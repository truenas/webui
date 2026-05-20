import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { BehaviorSubject, of } from 'rxjs';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetSettingsRef } from 'app/pages/dashboard/types/widget-settings-ref.interface';
import {
  WidgetDatasetCompressionRatioSettings,
} from 'app/pages/dashboard/widgets/storage/widget-dataset-compression-ratio/widget-dataset-compression-ratio.definition';
import {
  WidgetDatasetCompressionRatioSettingsComponent,
} from './widget-dataset-compression-ratio-settings.component';

describe('WidgetDatasetCompressionRatioSettingsComponent', () => {
  let spectator: Spectator<WidgetDatasetCompressionRatioSettingsComponent>;
  let loader: HarnessLoader;
  const settings$ = new BehaviorSubject<WidgetDatasetCompressionRatioSettings>(
    {} as WidgetDatasetCompressionRatioSettings,
  );

  const createComponent = createComponentFactory({
    component: WidgetDatasetCompressionRatioSettingsComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockProvider(WidgetSettingsRef, {
        getSettings: jest.fn(() => settings$),
        updateValidity: jest.fn(),
        updateSettings: jest.fn(),
      }),
      mockProvider(WidgetResourcesService, {
        datasets$: of([
          { id: 'tank' },
          { id: 'tank/data' },
          { id: 'tank/media' },
        ] as Dataset[]),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('pre-selects the first dataset when no settings are provided', async () => {
    const dataset = await loader.getHarness(IxSelectHarness.with({ label: 'Dataset' }));
    expect(await dataset.getValue()).toBe('tank');
  });

  it('lists every dataset as an option', async () => {
    const dataset = await loader.getHarness(IxSelectHarness.with({ label: 'Dataset' }));
    expect(await dataset.getOptionLabels()).toEqual(['tank', 'tank/data', 'tank/media']);
  });
});
