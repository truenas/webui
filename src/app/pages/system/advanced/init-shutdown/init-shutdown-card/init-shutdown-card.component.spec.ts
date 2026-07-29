import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
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
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  InitShutdownCardComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-card/init-shutdown-card.component';
import {
  InitShutdownFormComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

describe('InitShutdownCardComponent', () => {
  let spectator: Spectator<InitShutdownCardComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;
  let formPanel: FormSidePanelService;

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
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.cancel()),
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
    formPanel = spectator.inject(FormSidePanelService);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Command / Script', 'Description', 'When', 'Enabled', 'Timeout', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['/mnt/tank/script.sh', 'Prepare system', 'POSTINIT', 'Yes', '10', ''],
      ['echo "Hello World"', 'Greeting', 'POSTINIT', 'Yes', '20', ''],
    ]);
  });

  it('opens the Add Init/Shutdown Script form in a side panel when Add is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(formPanel.open).toHaveBeenCalledWith(InitShutdownFormComponent, {
      title: 'Add Init/Shutdown Script',
    });
  });

  it('opens the Edit Init/Shutdown Script form with the selected row when Edit is pressed', async () => {
    const menu = await openFirstRowMenu();
    await menu.clickItem({ label: 'Edit' });

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(formPanel.open).toHaveBeenCalledWith(InitShutdownFormComponent, {
      title: 'Edit Init/Shutdown Script',
      inputs: { editScript: scripts[0] },
    });
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
