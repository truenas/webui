import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { InitShutdownScriptType } from 'app/enums/init-shutdown-script-type.enum';
import { InitShutdownScriptWhen } from 'app/enums/init-shutdown-script-when.enum';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { IxTableModule } from 'app/modules/ix-table/ix-table.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  InitShutdownCardComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-card/init-shutdown-card.component';
import {
  InitShutdownFormComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('InitShutdownCardComponent', () => {
  let spectator: Spectator<InitShutdownCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

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
    },

  ] as InitShutdownScript[];

  const createComponent = createComponentFactory({
    component: InitShutdownCardComponent,
    imports: [
      AppLoaderModule,
      IxTableModule,
    ],
    providers: [
      mockWebSocket([
        mockCall('initshutdownscript.query', scripts),
        mockCall('initshutdownscript.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxChainedSlideInService, {
        open: jest.fn(() => of({ response: true, error: null })),
      }),
      mockProvider(ChainedRef, { close: jest.fn(), getData: jest.fn(() => undefined) }),
      mockProvider(AdvancedSettingsService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Command / Script', 'Description', 'When', 'Enabled', 'Timeout', ''],
      [
        '/mnt/tank/script.sh',
        'Prepare system',
        'POSTINIT',
        'Yes',
        '10',
        '',
      ],
      [
        'echo "Hello World"',
        'Greeting',
        'POSTINIT',
        'Yes',
        '20',
        '',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an init shutdown script when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'edit' }), 'Prepare system');
    await editButton.click();

    expect(spectator.inject(IxChainedSlideInService).open).toHaveBeenCalledWith(
      InitShutdownFormComponent,
      false,
      expect.objectContaining(scripts[0]),
    );
  });

  it('deletes a script with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInRow(IxIconHarness.with({ name: 'delete' }), 'Prepare system');
    await deleteIcon.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('initshutdownscript.delete', [1]);
  });
});
