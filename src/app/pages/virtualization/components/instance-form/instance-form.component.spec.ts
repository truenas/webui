import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import {
  createRoutingFactory,
  mockProvider,
  SpectatorRouting,
} from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VirtualizationType } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { InstanceFormComponent } from 'app/pages/virtualization/components/instance-form/instance-form.component';
import { WebSocketService } from 'app/services/ws.service';

describe('InstanceFormComponent', () => {
  let spectator: SpectatorRouting<InstanceFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;
  const createComponent = createRoutingFactory({
    component: InstanceFormComponent,
    providers: [
      mockWebSocket([
        mockCall('virt.instance.query', [{
          name: 'test-instance',
          type: VirtualizationType.Container,
          autostart: false,
        } as VirtualizationInstance]),
      ]),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(undefined),
        })),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  describe('editing existing instance', () => {
    it('loads existing instance using router params and sets form values', async () => {
      spectator.setRouteParam('id', 'test-instance');
      spectator.component.ngOnInit();

      expect(spectator.inject(WebSocketService).call)
        .toHaveBeenCalledWith('virt.instance.query', [[['id', '=', 'test-instance']]]);
      expect(await form.getValues()).toEqual({
        Name: 'test-instance',

      });
    });

    it('updates existing instance when form is submitted', async () => {
      spectator.setRouteParam('id', 'test-instance');
      spectator.component.ngOnInit();

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('virt.instance.update', ['test-instance', {
        name: 'test-instance',
      }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/virtualization/test-instance']);
    });
  });

  describe('creating a new instance', () => {
    it('creates new instance when form is submitted', async () => {
      await form.fillForm({
        Name: 'new-instance',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('virt.instance.create', [{
        name: 'new-instance',
      }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/virtualization/new-instance']);
    });
  });

  describe('form fields', () => {

  });
});
