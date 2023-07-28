import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { TreeModule } from '@bugsplat/angular-tree-component';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { MockWebsocketService } from 'app/core/testing/classes/mock-websocket.service';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { InitShutdownScriptType } from 'app/enums/init-shutdown-script-type.enum';
import { InitShutdownScriptWhen } from 'app/enums/init-shutdown-script-when.enum';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { InitShutdownFormComponent } from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('InitShutdownFormComponent', () => {
  let spectator: Spectator<InitShutdownFormComponent>;
  let loader: HarnessLoader;
  let ws: MockWebsocketService;
  const createComponent = createComponentFactory({
    component: InitShutdownFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
      TreeModule,
    ],
    providers: [
      mockWebsocket([
        mockCall('initshutdownscript.create'),
        mockCall('initshutdownscript.update'),
      ]),
      mockProvider(IxSlideInService),
      mockProvider(FormErrorHandlerService),
      mockProvider(SystemGeneralService),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => {
          return () => {
            return of([]);
          };
        }),
      }),
      mockProvider(IxSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
    ],
  });

  describe('adding new init/shutdown script', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(MockWebsocketService);
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
      await form.fillForm({
        Description: 'New 2',
        Type: 'Script',
        When: 'Shutdown',
        Enabled: true,
      });
      await form.fillForm({
        Script: '/mnt/new.sh',
      });

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
          {
            provide: SLIDE_IN_DATA,
            useValue: {
              id: 13,
              comment: 'Existing script',
              enabled: true,
              type: InitShutdownScriptType.Script,
              script: '/mnt/existing.sh',
              when: InitShutdownScriptWhen.PostInit,
              timeout: 45,
            } as InitShutdownScript,
          },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      ws = spectator.inject(MockWebsocketService);
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
      await form.fillForm({
        Enabled: false,
        Type: 'Command',
      });
      await form.fillForm({
        Command: 'ls -la',
      });

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
