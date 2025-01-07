import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ReportingExporter, ReportingExporterKey } from 'app/interfaces/reporting-exporters.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ReportingExportersFormComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-form/reporting-exporters-form.component';
import { ReportingExporterListComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-list/reporting-exporters-list.component';

const exporters: ReportingExporter[] = [
  {
    id: 1,
    attributes: {
      secret: 'abcd',
      email: 'testemail',
      exporter_type: ReportingExporterKey.Graphite,
    },
    enabled: true,
    name: 'test',
  },
];

describe('ReportingExportersListComponent', () => {
  let spectator: Spectator<ReportingExporterListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: ReportingExporterListComponent,
    imports: [
      SearchInput1Component,
      FakeProgressBarComponent,
    ],
    providers: [
      mockApi([
        mockCall('reporting.exporters.query', exporters),
        mockCall('reporting.exporters.delete'),
        mockCall('reporting.exporters.update'),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
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

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(ReportingExportersFormComponent);
  });

  it('opens reporting exporters form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 3);
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(ReportingExportersFormComponent, {
      data: exporters[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 3);
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('reporting.exporters.delete', [1]);
  });

  it('updates a reporting exporter when Enabled checkbox is toggled', async () => {
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 2);
    await toggle.toggle();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('reporting.exporters.update', [
      1,
      { enabled: false },
    ]);
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
