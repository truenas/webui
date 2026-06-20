import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
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
import { ApiService } from 'app/modules/websocket/api.service';
import {
  InitShutdownCardComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-card/init-shutdown-card.component';
import {
  InitShutdownFormComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { FilesystemService } from 'app/services/filesystem.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

describe('InitShutdownCardComponent', () => {
  let spectator: Spectator<InitShutdownCardComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const scripts = [
    {
      id: 1,
      script: '/mnt/tank/script.sh',
      when: InitShutdownScriptWhen.PostInit,
      enabled: true,
      comment: 'Prepare system',
      timeout: 10,
      type: InitShutdownScriptType.Script,
    },
    {
      id: 2,
      command: 'echo "Hello World"',
      when: InitShutdownScriptWhen.PostInit,
      enabled: true,
      comment: 'Greeting',
      timeout: 20,
      type: InitShutdownScriptType.Command,
    } as InitShutdownScript,
  ] as InitShutdownScript[];

  const createComponent = createComponentFactory({
    component: InitShutdownCardComponent,
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
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockProvider(FilesystemService, {
        getFilesystemNodeProvider: jest.fn(() => () => of([])),
      }),
      mockAuth(),
    ],
  });

  async function openFirstRowMenu(): Promise<TnMenuHarness> {
    spectator.click(
      spectator.query('[data-test="button-card-init-shutdown-undefined-postinit-more-action"]') as HTMLElement,
    );
    return TnMenuTesting.rootLoader(spectator.fixture).getHarness(TnMenuHarness);
  }

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Command / Script', 'Description', 'When', 'Enabled', 'Timeout', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['/mnt/tank/script.sh', 'Prepare system', 'POSTINIT', 'Yes', '10', ''],
      ['echo "Hello World"', 'Greeting', 'POSTINIT', 'Yes', '20', ''],
    ]);
  });

  it('opens the Add Init/Shutdown Script form in a side panel when Add is pressed', async () => {
    expect(spectator.query('ix-init-shutdown-form')).toBeNull();

    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    spectator.detectChanges();

    expect(spectator.query('ix-init-shutdown-form')).not.toBeNull();
  });

  it('closes the side panel when the hosted form emits closed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();
    spectator.detectChanges();
    expect(spectator.query('ix-init-shutdown-form')).not.toBeNull();

    spectator.query(InitShutdownFormComponent).closed.emit(true);
    spectator.detectChanges();

    expect(spectator.query('ix-init-shutdown-form')).toBeNull();
  });

  it('shows form to edit an init shutdown script when Edit button is pressed', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Edit' });
    spectator.detectChanges();

    const form = spectator.query(InitShutdownFormComponent);
    expect(form).not.toBeNull();
    expect(form.editScript()).toEqual(scripts[0]);
  });

  it('deletes a script with confirmation when Delete button is pressed', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Delete' });

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Delete Script',
      message: 'Delete Init/Shutdown Script undefined?',
      call: expect.any(Function),
      successMessage: 'Script deleted.',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('initshutdownscript.delete', [1]);
  });
});
