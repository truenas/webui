import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { TreeModule } from '@bugsplat/angular-tree-component';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { InitShutdownScriptType } from 'app/enums/init-shutdown-script-type.enum';
import { InitShutdownScriptWhen } from 'app/enums/init-shutdown-script-when.enum';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { InitShutdownFormComponent } from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('InitShutdownFormComponent', () => {
  let spectator: Spectator<InitShutdownFormComponent>;
  let loader: HarnessLoader;
  let api: MockApiService;

  const createComponent = createComponentFactory({
    component: InitShutdownFormComponent,
    imports: [
      ReactiveFormsModule,
      TreeModule,
    ],
    providers: [
      mockApi([
        mockCall('initshutdownscript.create'),
        mockCall('initshutdownscript.update'),
      ]),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
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
      mockProvider(SlideInRef, {
        close: jest.fn(),
        getData: jest.fn((): undefined => undefined),
        requireConfirmationWhen: jest.fn(),
      }),
      mockAuth(),
    ],
  });

  async function getInput(formControlName: string): Promise<TnInputHarness> {
    return loader.getHarness(TnInputHarness.with({ selector: `[formControlName="${formControlName}"]` }));
  }

  async function getSelect(formControlName: string): Promise<TnSelectHarness> {
    return loader.getHarness(TnSelectHarness.with({ selector: `[formControlName="${formControlName}"]` }));
  }

  async function getCheckbox(formControlName: string): Promise<TnCheckboxHarness> {
    return loader.getHarness(TnCheckboxHarness.with({ selector: `[formControlName="${formControlName}"]` }));
  }

  describe('adding new init/shutdown script', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(MockApiService);
    });

    it('saves values for new script when form is being submitted', async () => {
      await (await getInput('comment')).setValue('Clear space');
      await (await getSelect('type')).selectOption('Command');
      await (await getInput('command')).setValue('rf -rf /');
      await (await getSelect('when')).selectOption('Pre Init');
      await (await getInput('timeout')).setValue('60');

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('initshutdownscript.create', [{
        command: 'rf -rf /',
        comment: 'Clear space',
        enabled: true,
        timeout: 60,
        type: InitShutdownScriptType.Command,
        when: InitShutdownScriptWhen.PreInit,
      }]);
    });

    it('shows and saves script file when type is Script', async () => {
      await (await getInput('comment')).setValue('New 2');
      await (await getSelect('type')).selectOption('Script');
      await (await getSelect('when')).selectOption('Shutdown');

      const explorer = await loader.getHarness(IxExplorerHarness);
      await explorer.setValue('/mnt/new.sh');

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('initshutdownscript.create', [{
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
          mockProvider(SlideInRef, {
            close: jest.fn(),
            requireConfirmationWhen: jest.fn(),
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
      api = spectator.inject(MockApiService);
    });

    it('shows current values when form is being edited', async () => {
      expect(await (await getInput('comment')).getValue()).toBe('Existing script');
      expect(await (await getSelect('type')).getDisplayText()).toBe('Script');
      expect(await (await getSelect('when')).getDisplayText()).toBe('Post Init');
      expect(await (await getCheckbox('enabled')).isChecked()).toBe(true);
      expect(await (await getInput('timeout')).getValue()).toBe('45');

      const explorer = await loader.getHarness(IxExplorerHarness);
      expect(await explorer.getValue()).toBe('/mnt/existing.sh');
    });

    it('sends an update payload to websocket and closes modal when save is pressed', async () => {
      await (await getCheckbox('enabled')).uncheck();
      await (await getSelect('type')).selectOption('Command');
      await (await getInput('command')).setValue('ls -la');

      const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('initshutdownscript.update', [
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
