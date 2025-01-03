import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AlertService } from 'app/interfaces/alert-service.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { AlertServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-service.component';
import { AlertServiceListComponent } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.component';

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
      mockApi([
        mockCall('alertservice.query', alertServices),
        mockCall('alertservice.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
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

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(AlertServiceComponent, {
      data: alertServices[0],
    });
  });

  it('shows form to create new Alert Service when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(AlertServiceComponent);
  });

  it('deletes Alert Service with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 4);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Alert Service <b>"SNMP Trap"</b>?',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('alertservice.delete', [1]);
  });
});
