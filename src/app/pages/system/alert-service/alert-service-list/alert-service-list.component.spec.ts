import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { AlertService } from 'app/interfaces/alert-service.interface';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { AlertServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-service.component';
import { AlertServiceListComponent } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

describe('AlertServiceListComponent', () => {
  let spectator: Spectator<AlertServiceListComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

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
      AppLoaderModule,
      IxTable2Module,
    ],
    providers: [
      mockAuth(),
      mockWebsocket([
        mockCall('alertservice.query', alertServices),
        mockCall('alertservice.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
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

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(AlertServiceComponent, {
      data: alertServices[0],
    });
  });

  it('shows form to create new Alert Service when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(AlertServiceComponent);
  });

  it('deletes Alert Service with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 4);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Alert Service <b>"SNMP Trap"</b>?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('alertservice.delete', [1]);
  });
});
