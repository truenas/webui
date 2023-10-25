import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { InitShutdownScriptType } from 'app/enums/init-shutdown-script-type.enum';
import { InitShutdownScriptWhen } from 'app/enums/init-shutdown-script-when.enum';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import {
  InitShutdownFormComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import {
  InitShutdownListComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-list/init-shutdown-list.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('InitShutdownListComponent', () => {
  let spectator: Spectator<InitShutdownListComponent>;
  let table: IxTable2Harness;
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
    },
  ] as InitShutdownScript[];

  const createComponent = createComponentFactory({
    component: InitShutdownListComponent,
    imports: [
      IxTable2Module,
    ],
    providers: [
      mockWebsocket([
        mockCall('initshutdownscript.query', scripts),
        mockCall('initshutdownscript.delete'),
      ]),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => ({
          slideInClosed$: of(true),
        })),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('shows table rows', async () => {
    expect(await table.getCellTexts()).toEqual([
      ['Type', 'Description', 'When', 'Command/Script', 'Enabled', ''],
      ['Script', 'Remove Bob files', 'Post Init', '/mnt/bob/rm.sh', 'Yes', ''],
      ['Command', 'Remove Peter files', 'Shutdown', 'rm -rf /mnt/peter/*', 'No', ''],
    ]);
  });

  it('opens an edit form when edit icon is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(
      InitShutdownFormComponent,
      { data: scripts[0] },
    );
  });

  it('deletes an item when delete button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 5);
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('initshutdownscript.delete', [1]);
  });
});
