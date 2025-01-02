import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { StaticRouteFormComponent } from 'app/pages/network/components/static-route-form/static-route-form.component';

describe('StaticRouteFormComponent', () => {
  let spectator: Spectator<StaticRouteFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
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
      mockProvider(SlideIn, {
        open: jest.fn(),
        components$: of([]),
      }),
      mockProvider(FormErrorHandlerService),
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
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Destination: '10.24.12.13/16',
        Gateway: '10.24.12.1',
        Description: 'My route',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('staticroute.create', [{
        destination: '10.24.12.13/16',
        gateway: '10.24.12.1',
        description: 'My route',
      }]);
    });
  });

  describe('editing a group', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: () => editingRoute }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows current group values when form is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Destination: '20.24.12.13/16',
        Gateway: '20.24.12.1',
        Description: 'Existing route',
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Destination: '15.24.12.13/16',
        Gateway: '15.24.12.1',
        Description: 'Updated route',
      });

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
  });
});
