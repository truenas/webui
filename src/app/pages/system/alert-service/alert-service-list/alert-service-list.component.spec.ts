import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { AlertService } from 'app/interfaces/alert-service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { AlertServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-service.component';
import { AlertServiceListComponent } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('AlertServiceListComponent', () => {
  let spectator: Spectator<AlertServiceListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const alertServices = [
    {
      id: 1,
      name: 'SNMP Trap',
      type: 'SNMPTrap',
      attributes: {
        port: 162,
      },
      enabled: true,
      level: 'WARNING',
      type__title: 'SNMP Trap',
    } as AlertService,
  ];

  const createComponent = createComponentFactory({
    component: AlertServiceListComponent,
    imports: [
      SearchInput1Component,
      IxTableColumnsSelectorComponent,
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('alertservice.query', alertServices),
        mockCall('alertservice.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInService, {
        open: jest.fn(() => ({
          slideInClosed$: of(),
        })),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Service Name', 'Type', 'Level', 'Enabled', ''],
      ['SNMP Trap', 'SNMP Trap', 'Warning', 'Yes', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit an existing Alert Service when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 4);
    await editButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(AlertServiceComponent, {
      data: alertServices[0],
    });
  });

  it('shows form to create new Alert Service when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(AlertServiceComponent);
  });

  it('deletes Alert Service with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 4);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Alert Service <b>"SNMP Trap"</b>?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('alertservice.delete', [1]);
  });
});
