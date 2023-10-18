import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { ReportingExporter, ReportingExporterKey } from 'app/interfaces/reporting-exporters.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { ReportingExportersFormComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-form/reporting-exporters-form.component';
import { ReportingExporterListComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-list/reporting-exporters-list.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
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

  const createComponent = createComponentFactory({
    component: ReportingExporterListComponent,
    imports: [
      IxTable2Module,
    ],
    providers: [
      mockWebsocket([
        mockCall('reporting.exporters.query', exporters),
        mockCall('reporting.exporters.delete'),
        mockCall('reporting.exporters.update'),
      ]),
      mockProvider(IxSlideInRef, {
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('shows acurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Reporting Exporters');
  });

  it('opens exporter form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(ReportingExportersFormComponent);
  });

  it('opens acme dns authenticator form when "Edit" button is pressed', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Edit"]' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(ReportingExportersFormComponent, {
      data: exporters[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Delete"]' }));
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('reporting.exporters.delete', [1]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Type', 'Enabled', ''],
      ['test', ReportingExporterKey.Graphite, '', ''],
    ];

    const table = await loader.getHarness(IxTable2Harness);
    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});