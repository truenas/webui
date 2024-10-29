import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { TunableType } from 'app/enums/tunable-type.enum';
import { Tunable } from 'app/interfaces/tunable.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { TunableFormComponent } from 'app/pages/system/advanced/sysctl/tunable-form/tunable-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('TunableFormComponent', () => {
  let spectator: Spectator<TunableFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: TunableFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockJob('tunable.create', fakeSuccessfulJob()),
        mockJob('tunable.update', fakeSuccessfulJob()),
      ]),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of({ response: true, error: null })),
        components$: of([]),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(ChainedRef, {
        close: jest.fn(),
        getData: jest.fn(() => undefined),
      }),
      mockAuth(),
    ],
  });

  describe('adding a new sysctl variable', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
    });

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

      expect(ws.job).toHaveBeenCalledWith('tunable.create', [{
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
      spectator = createComponent({
        providers: [
          mockProvider(ChainedRef, {
            close: jest.fn(),
            getData: jest.fn(() => ({
              id: 1,
              comment: 'Existing variable',
              enabled: false,
              var: 'var.exist',
              value: 'Existing value',
            } as Tunable)),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(WebSocketService);
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

      expect(ws.job).toHaveBeenCalledWith('tunable.update', [
        1,
        {
          comment: 'Existing variable',
          enabled: true,
          value: 'New value',
        },
      ]);
    });
  });
});
