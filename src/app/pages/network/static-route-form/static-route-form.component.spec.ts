import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { StaticRoute } from 'app/interfaces/static-route.interface';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/pages/common/ix-forms/testing/ix-form.harness';
import { StaticRouteFormComponent } from 'app/pages/network/static-route-form/static-route-form.component';
import { WebSocketService } from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';

describe('StaticRouteFormComponent', () => {
  let spectator: Spectator<StaticRouteFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: StaticRouteFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('staticroute.create'),
        mockCall('staticroute.update'),
      ]),
      mockProvider(IxModalService),
      mockProvider(FormErrorHandlerService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  describe('adding a static route', () => {
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
      spectator.component.setEditingStaticRoute({
        id: 13,
        description: 'Existing route',
        destination: '20.24.12.13/16',
        gateway: '20.24.12.1',
      } as StaticRoute);
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
