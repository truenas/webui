import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { InitShutdownScriptType } from 'app/enums/init-shutdown-script-type.enum';
import { InitShutdownScriptWhen } from 'app/enums/init-shutdown-script-when.enum';
import { InitShutdownScript } from 'app/interfaces/init-shutdown-script.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import {
  InitShutdownFormComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-form/init-shutdown-form.component';
import {
  InitShutdownListComponent,
} from 'app/pages/system/advanced/init-shutdown/init-shutdown-list/init-shutdown-list.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('InitShutdownListComponent', () => {
  let spectator: Spectator<InitShutdownListComponent>;
  let table: IxTableHarness;
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
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
    ],
    providers: [
      mockWebSocket([
        mockCall('initshutdownscript.query', scripts),
        mockCall('initshutdownscript.delete'),
      ]),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of([])),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    const loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
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

    expect(spectator.inject(ChainedSlideInService).open).toHaveBeenCalledWith(
      InitShutdownFormComponent,
      false,
      expect.objectContaining(scripts[0]),
    );
  });

  it('deletes an item when delete button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 5);
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('initshutdownscript.delete', [1]);
  });
});
