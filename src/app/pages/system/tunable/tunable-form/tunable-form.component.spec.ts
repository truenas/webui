import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { TunableType } from 'app/enums/tunable-type.enum';
import { Tunable } from 'app/interfaces/tunable.interface';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/pages/common/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/pages/common/ix-forms/testing/ix-form.harness';
import { TunableFormComponent } from 'app/pages/system/tunable/tunable-form/tunable-form.component';
import { WebSocketService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('TunableFormComponent', () => {
  let spectator: Spectator<TunableFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: TunableFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('tunable.create'),
        mockCall('tunable.update'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  describe('adding a new sysctl variable', () => {
    it('sends a create payload to websocket and closes modal form is saved', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Variable: 'some.var',
        Value: '42',
        Description: 'Answer to the question',
        Enabled: true,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('tunable.create', [{
        comment: 'Answer to the question',
        enabled: true,
        type: TunableType.Sysctl,
        value: '42',
        var: 'some.var',
      }]);
    });
  });

  describe('editing a sysctl variable', () => {
    beforeEach(() => {
      spectator.component.setTunableForEdit({
        id: 1,
        comment: 'Existing variable',
        enabled: false,
        var: 'var.exist',
        value: 'Existing value',
      } as Tunable);
    });

    it('shows current group values when form is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Variable: 'var.exist',
        Description: 'Existing variable',
        Value: 'Existing value',
        Enabled: false,
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Enabled: true,
        Value: 'New value',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('tunable.update', [
        1,
        {
          comment: 'Existing variable',
          enabled: true,
          type: TunableType.Sysctl,
          value: 'New value',
          var: 'var.exist',
        },
      ]);
    });
  });
});
