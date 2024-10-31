import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { WidgetSettingsRef } from 'app/pages/dashboard/types/widget-settings-ref.interface';
import { WidgetInterfaceIpSettingsComponent } from 'app/pages/dashboard/widgets/network/widget-interface-ip/widget-interface-ip-settings/widget-interface-ip-settings.component';

describe('WidgetInterfaceIpSettingsComponent', () => {
  let spectator: Spectator<WidgetInterfaceIpSettingsComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: WidgetInterfaceIpSettingsComponent,
    imports: [ReactiveFormsModule],
    providers: [
      mockProvider(WidgetSettingsRef, {
        getSettings: jest.fn(),
        updateValidity: jest.fn(),
        updateSettings: jest.fn(),
      }),
      mockProvider(WidgetResourcesService, {
        networkInterfaces$: of({
          isLoading: false,
          error: null,
          value: [{
            id: '1',
            name: 'eth0',
          }, {
            id: '2',
            name: 'eth1',
          }, {
            id: '3',
            name: 'eth2',
          }],
        }),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    jest.restoreAllMocks();
  });

  it('checks pre-select first option when no settings', async () => {
    const networkInterface = await loader.getHarness(IxSelectHarness.with({ label: 'Interface' }));
    const selectedInterface = await networkInterface.getValue();
    expect(selectedInterface).toBe('eth0');
  });

  it('checks interface options', async () => {
    const networkInterface = await loader.getHarness(IxSelectHarness.with({ label: 'Interface' }));
    expect(await networkInterface.getOptionLabels()).toEqual(['eth0', 'eth1', 'eth2']);
  });
});
