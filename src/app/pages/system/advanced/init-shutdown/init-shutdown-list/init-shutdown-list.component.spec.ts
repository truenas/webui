import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnMenuHarness, TnMenuTesting, TnTableHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { InitShutdownScriptType } from 'app/enums/init-shutdown-script-type.enum';
import { InitShutdownScriptWhen } from 'app/enums/init-shutdown-script-when.enum';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  InitShutdownFormComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import {
  InitShutdownListComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-list/init-shutdown-list.component';
import { FilesystemService } from 'app/services/filesystem.service';

describe('InitShutdownListComponent', () => {
  let spectator: Spectator<InitShutdownListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;
  const scripts = [
    {
      id: 1,
      script: '/mnt/bob/rm.sh',
      when: InitShutdownScriptWhen.PostInit,
      enabled: true,
      type: InitShutdownScriptType.Script,
      comment: 'Remove Bob files',
    },
    {
      id: 2,
      command: 'rm -rf /mnt/peter/*',
      when: InitShutdownScriptWhen.Shutdown,
      enabled: false,
      type: InitShutdownScriptType.Command,
      comment: 'Remove Peter files',
    } as InitShutdownScript,
  ] as InitShutdownScript[];

  const createComponent = createComponentFactory({
    component: InitShutdownListComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('initshutdownscript.query', scripts),
        mockCall('initshutdownscript.delete'),
      ]),
      mockProvider(DialogService, {
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => () => of([])),
      }),
      mockProvider(SnackbarService),
      mockProvider(FormErrorHandlerService),
      mockAuth(),
    ],
  });

  async function openFirstRowMenu(): Promise<TnMenuHarness> {
    spectator.click(spectator.query('[data-test$="more-action"]') as HTMLElement);
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Type', 'Description', 'When', 'Command/Script', 'Enabled', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['Script', 'Remove Bob files', 'Post Init', '/mnt/bob/rm.sh', 'Yes', ''],
      ['Command', 'Remove Peter files', 'Shutdown', 'rm -rf /mnt/peter/*', 'No', ''],
    ]);
  });

  it('opens the Add form in a side panel when Add is pressed', async () => {
    expect(spectator.query('ix-init-shutdown-form')).toBeNull();

    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    spectator.detectChanges();

    expect(spectator.query('ix-init-shutdown-form')).not.toBeNull();
  });

  it('opens an edit form in the side panel with the selected row when Edit is pressed', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Edit' });
    spectator.detectChanges();

    const form = spectator.query(InitShutdownFormComponent);
    expect(form).not.toBeNull();
    expect(form.editScript()).toEqual(scripts[0]);
  });

  it('deletes an item when delete button is pressed', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Are you sure you want to delete this script?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('initshutdownscript.delete', [1]);
  });
});
