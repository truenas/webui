import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnSelectHarness } from '@truenas/ui-components';
import { BehaviorSubject, of } from 'rxjs';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetSettingsRef } from 'app/pages/dashboard/types/widget-settings-ref.interface';
import { WidgetAppSettings } from 'app/pages/dashboard/widgets/apps/widget-app/widget-app.definition';
import { WidgetAppSettingsComponent } from 'app/pages/dashboard/widgets/apps/widget-app-settings/widget-app-settings.component';

describe('WidgetAppSettingsComponent', () => {
  let spectator: Spectator<WidgetAppSettingsComponent>;
  let loader: HarnessLoader;
  const settings$ = new BehaviorSubject<WidgetAppSettings>({} as WidgetAppSettings);

  const createComponent = createComponentFactory({
    component: WidgetAppSettingsComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockProvider(WidgetSettingsRef, {
        getSettings: jest.fn(() => settings$),
        updateValidity: jest.fn(),
        updateSettings: jest.fn(),
      }),
      mockProvider(WidgetResourcesService, {
        installedApps$: of([{
          id: 1,
          name: 'App 1',
        }, {
          id: 2,
          name: 'App 2',
        }, {
          id: 3,
          name: 'App 3',
        }]),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    jest.restoreAllMocks();
  });

  it('checks pre-select first option when no settings', async () => {
    const application = await loader.getHarness(TnSelectHarness);
    const selectedApplication = await application.getDisplayText();
    expect(selectedApplication).toBe('App 1');
  });

  it('checks app options', async () => {
    const select = await loader.getHarness(TnSelectHarness);
    expect(await select.getOptions()).toEqual(['App 1', 'App 2', 'App 3']);
  });
});
