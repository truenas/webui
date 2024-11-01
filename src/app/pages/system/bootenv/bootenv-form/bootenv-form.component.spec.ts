import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { BootEnvironmentAction } from 'app/enums/boot-environment-action.enum';
import { IxInputHarness } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { BootEnvironmentFormComponent } from 'app/pages/system/bootenv/bootenv-form/bootenv-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('BootEnvironmentFormComponent', () => {
  let spectator: Spectator<BootEnvironmentFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: BootEnvironmentFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('bootenv.create'),
        mockCall('bootenv.update'),
      ]),
      mockProvider(SlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(SlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      mockAuth(),
    ],
  });

  /*
  * Create
  */
  describe('creating a boot environment', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              operation: BootEnvironmentAction.Create,
            },
          },
        ],
      });
      ws = spectator.inject(WebSocketService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('sends a create payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const fields = { name: 'myBootEnv' };

      await form.fillForm({
        Name: fields.name,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('bootenv.create', [fields]);
    });
  });

  /*
  * Clone
  */
  describe('cloning a boot environment', () => {
    const cloneSource = 'original';

    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              operation: BootEnvironmentAction.Clone,
              name: cloneSource,
            },
          },
        ],
      });
      ws = spectator.inject(WebSocketService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('should add source field to DOM', () => {
      const sourceFieldElement = IxInputHarness.with({ label: 'Source' });
      expect(sourceFieldElement).toBeTruthy();
    });

    it('sends a create payload with source option to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const fields = {
        name: 'cloned',
        source: cloneSource,
      };

      await form.fillForm({
        Name: fields.name,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('bootenv.create', [
        fields,
      ]);
    });
  });

  /*
  * Rename
  */
  describe('renaming a boot environment', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              operation: BootEnvironmentAction.Rename,
              name: 'myBootEnv',
            },
          },
        ],
      });
      ws = spectator.inject(WebSocketService);
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const fields = { name: 'updated' };
      await form.fillForm({
        Name: fields.name,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('bootenv.update', [
        spectator.component.currentName,
        fields,
      ]);
    });
  });
});
