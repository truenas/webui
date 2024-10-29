import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { StaticRouteFormComponent } from 'app/pages/network/components/static-route-form/static-route-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('StaticRouteFormComponent', () => {
  let spectator: Spectator<StaticRouteFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: StaticRouteFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('staticroute.create'),
        mockCall('staticroute.update'),
      ]),
      mockProvider(SlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(SlideInRef),
      mockAuth(),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('adding a static route', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
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

      expect(ws.call).toHaveBeenCalledWith('staticroute.create', [{
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
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              id: 13,
              description: 'Existing route',
              destination: '20.24.12.13/16',
              gateway: '20.24.12.1',
            } as StaticRoute,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
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

      expect(ws.call).toHaveBeenCalledWith('staticroute.update', [
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
