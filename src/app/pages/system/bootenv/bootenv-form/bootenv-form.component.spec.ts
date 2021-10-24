import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { BootEnvironmentActions } from 'app/enums/bootenv-actions.enum';
import { IxFormsModule } from 'app/pages/common/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/pages/common/ix-forms/testing/ix-form.harness';
import { BootEnvironmentFormComponent } from 'app/pages/system/bootenv/bootenv-form/bootenv-form.component';
import { WebSocketService } from 'app/services';
import { IxModalService } from 'app/services/ix-modal.service';

describe('BootEnvironmentFormComponent', () => {
  let spectator: Spectator<BootEnvironmentFormComponent>;
  let loader: HarnessLoader;
  let ws: WebSocketService;
  const createComponent = createComponentFactory({
    component: BootEnvironmentFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('bootenv.create'),
        mockCall('bootenv.update'),
      ]),
      mockProvider(IxModalService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    ws = spectator.inject(WebSocketService);
  });

  /*
  * Create
  */
  describe('creating a boot environment', () => {
    beforeEach(() => {
      spectator.component.setupForm(BootEnvironmentActions.Create);
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
      spectator.component.setupForm(BootEnvironmentActions.Clone, cloneSource);
    });

    it('should add the FormControl for source field', () => {
      const controls = spectator.component.formGroup.controls;
      const controlKeys = Object.keys(controls);
      expect(controlKeys).toContain('source');
      expect(controls.source.value).toBe(cloneSource);
    });
  });

  /*
  * Rename
  */
  describe('renaming a boot environment', () => {
    beforeEach(() => {
      spectator.component.setupForm(BootEnvironmentActions.Rename, 'myBootEnv');
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
