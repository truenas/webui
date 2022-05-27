import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { DashboardFormComponent } from 'app/pages/dashboard/components/dashboard-form/dashboard-form.component';
import { DashConfigItem } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('DashboardFormComponent', () => {
  let spectator: Spectator<DashboardFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  let dashState: DashConfigItem[];

  const createComponent = createComponentFactory({
    component: DashboardFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('user.set_attribute'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    ws = spectator.inject(WebSocketService);
    dashState = [
      {
        name: 'CPU',
        rendered: true,
      },
      {
        name: 'Memory',
        rendered: false,
      },
    ];
  });

  describe('configure dashboard widget visibility', () => {
    beforeEach(() => {
      spectator.component.setupForm(dashState);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('sends a create payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const clone = Object.assign([], dashState);
      clone[1].rendered = true;

      await form.fillForm({
        Memory: clone[1].rendered,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('user.set_attribute', [1, 'dashState', clone]);
    });
  });
});
