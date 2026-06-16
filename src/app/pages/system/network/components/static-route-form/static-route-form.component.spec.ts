// cspell:ignore staticroute ngneat
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { StaticRouteFormComponent } from 'app/pages/system/network/components/static-route-form/static-route-form.component';

describe('StaticRouteFormComponent', () => {
  let spectator: Spectator<StaticRouteFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const setInput = async (name: string, value: string): Promise<void> => {
    const input = await loader.getHarness(TnInputHarness.with({ name }));
    await input.setValue(value);
  };

  const getInputValue = async (name: string): Promise<string> => {
    const input = await loader.getHarness(TnInputHarness.with({ name }));
    return input.getValue();
  };

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const editingRoute = {
    id: 13,
    description: 'Existing route',
    destination: '20.24.12.13/16',
    gateway: '20.24.12.1',
  } as StaticRoute;

  const createComponent = createComponentFactory({
    component: StaticRouteFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('staticroute.create'),
        mockCall('staticroute.update'),
      ]),
      ...ixFormTestingProviders(),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  describe('adding a static route', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('sends a create payload to websocket and closes modal when save is pressed', async () => {
      await setInput('destination', '10.24.12.13/16');
      await setInput('gateway', '10.24.12.1');
      await setInput('description', 'My route');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('staticroute.create', [{
        destination: '10.24.12.13/16',
        gateway: '10.24.12.1',
        description: 'My route',
      }]);
    });
  });

  describe('editing a route', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => editingRoute }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows current route values when form is being edited', async () => {
      expect(await getInputValue('destination')).toBe('20.24.12.13/16');
      expect(await getInputValue('gateway')).toBe('20.24.12.1');
      expect(await getInputValue('description')).toBe('Existing route');
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      await setInput('destination', '15.24.12.13/16');
      await setInput('gateway', '15.24.12.1');
      await setInput('description', 'Updated route');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('staticroute.update', [
        13,
        {
          destination: '15.24.12.13/16',
          gateway: '15.24.12.1',
          description: 'Updated route',
        },
      ]);
    });

    it('sends the full payload even when a single field is edited', async () => {
      await setInput('description', 'Only description changed');

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('staticroute.update', [
        13,
        {
          destination: '20.24.12.13/16',
          gateway: '20.24.12.1',
          description: 'Only description changed',
        },
      ]);
    });
  });
});
