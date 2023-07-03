import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { WidgetName } from 'app/pages/dashboard/components/dashboard/dashboard.component';
import { DashboardFormComponent } from 'app/pages/dashboard/components/dashboard-form/dashboard-form.component';
import { DashConfigItem } from 'app/pages/dashboard/components/widget-controller/widget-controller.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

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
        mockCall('auth.set_attribute'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(SnackbarService),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  beforeEach(() => {
    dashState = [
      {
        name: WidgetName.Cpu,
        rendered: true,
      },
      {
        name: WidgetName.Memory,
        rendered: false,
      },
    ];
    spectator = createComponent({
      providers: [
        { provide: SLIDE_IN_DATA, useValue: dashState },
      ],
    });
    ws = spectator.inject(WebSocketService);
  });

  describe('configure dashboard widget visibility', () => {
    beforeEach(() => {
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('sends a create payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const clone = Object.assign([] as DashConfigItem[], dashState);
      clone[1].rendered = true;

      await form.fillForm({
        Memory: clone[1].rendered,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('auth.set_attribute', ['dashState', clone]);
    });
  });
});
