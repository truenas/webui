import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { TreeModule } from '@bugsplat/angular-tree-component';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebSocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { InitShutdownScriptType } from 'app/enums/init-shutdown-script-type.enum';
import { InitShutdownScriptWhen } from 'app/enums/init-shutdown-script-when.enum';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { InitShutdownFormComponent } from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { FilesystemService } from 'app/services/filesystem.service';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('InitShutdownFormComponent', () => {
  let spectator: Spectator<InitShutdownFormComponent>;
  let loader: HarnessLoader;
  let ws: MockWebSocketService;
  const createComponent = createComponentFactory({
    component: InitShutdownFormComponent,
    imports: [
      ReactiveFormsModule,
      TreeModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('initshutdownscript.create'),
        mockCall('initshutdownscript.update'),
      ]),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of({ response: true, error: null })),
        components$: of([]),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(SystemGeneralService),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => {
          return () => {
            return of([]);
          };
        }),
      }),
      mockProvider(ChainedRef, { close: jest.fn(), getData: jest.fn(() => undefined) }),
      mockAuth(),
    ],
  });

  describe('adding new init/shutdown script', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(MockWebSocketService);
    });

    it('saves values for new script when form is being submitted', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Description: 'Clear space',
        Type: 'Command',
        Command: 'rf -rf /',
        When: 'Pre Init',
        Enabled: true,
        Timeout: 60,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('initshutdownscript.create', [{
        command: 'rf -rf /',
        comment: 'Clear space',
        enabled: true,
        timeout: 60,
        type: InitShutdownScriptType.Command,
        when: InitShutdownScriptWhen.PreInit,
      }]);
    });

    it('shows and saves script file when type is Script', async () => {
      const form = await loader.getHarness(IxFormHarness);

      await form.fillForm(
        {
          Description: 'New 2',
          Type: 'Script',
          When: 'Shutdown',
          Enabled: true,
          Script: '/mnt/new.sh',
        },
      );

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('initshutdownscript.create', [{
        comment: 'New 2',
        enabled: true,
        script: '/mnt/new.sh',
        timeout: 10,
        type: InitShutdownScriptType.Script,
        when: InitShutdownScriptWhen.Shutdown,
      }]);
    });
  });

  describe('editing existing init/shutdown script', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(ChainedRef, {
            close: jest.fn(),
            getData: jest.fn(() => ({
              id: 13,
              comment: 'Existing script',
              enabled: true,
              type: InitShutdownScriptType.Script,
              script: '/mnt/existing.sh',
              when: InitShutdownScriptWhen.PostInit,
              timeout: 45,
            } as InitShutdownScript)),
          }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(MockWebSocketService);
    });

    it('shows current group values when form is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Description: 'Existing script',
        Enabled: true,
        Type: 'Script',
        Script: '/mnt/existing.sh',
        Timeout: '45',
        When: 'Post Init',
      });
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);

      await form.fillForm(
        {
          Enabled: false,
          Type: 'Command',
          Command: 'ls -la',
        },
      );

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(ws.call).toHaveBeenCalledWith('initshutdownscript.update', [
        13,
        {
          comment: 'Existing script',
          enabled: false,
          command: 'ls -la',
          timeout: 45,
          type: InitShutdownScriptType.Command,
          when: InitShutdownScriptWhen.PostInit,
        },
      ]);
    });
  });
});
