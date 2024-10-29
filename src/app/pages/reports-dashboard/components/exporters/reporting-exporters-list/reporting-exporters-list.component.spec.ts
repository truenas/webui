import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ReportingExporter, ReportingExporterKey } from 'app/interfaces/reporting-exporters.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ReportingExportersFormComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-form/reporting-exporters-form.component';
import { ReportingExporterListComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-list/reporting-exporters-list.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

const exporters: ReportingExporter[] = [
  {
    id: 1,
    attributes: {
      secret: 'abcd',
      email: 'testemail',
    },
    enabled: true,
    name: 'test',
    type: ReportingExporterKey.Graphite,
  },
];

describe('ReportingExportersListComponent', () => {
  let spectator: Spectator<ReportingExporterListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: ReportingExporterListComponent,
    imports: [
      SearchInput1Component,
      FakeProgressBarComponent,
    ],
    providers: [
      mockWebSocket([
        mockCall('reporting.exporters.query', exporters),
        mockCall('reporting.exporters.delete'),
        mockCall('reporting.exporters.update'),
      ]),
      mockProvider(SlideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInService, {
        open: jest.fn(() => ({ slideInClosed$: of(true) })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows accurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Reporting Exporters');
  });

  it('opens exporter form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(ReportingExportersFormComponent);
  });

  it('opens reporting exporters form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 3);
    await editButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(ReportingExportersFormComponent, {
      data: exporters[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 3);
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('reporting.exporters.delete', [1]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Type', 'Enabled', ''],
      ['test', ReportingExporterKey.Graphite, '', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
