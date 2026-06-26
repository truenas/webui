import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnIconButtonHarness, TnSlideToggleHarness, TnTableHarness,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { ReportingExporter, ReportingExporterKey } from 'app/interfaces/reporting-exporters.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
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
  let table: TnTableHarness;

  const slideInRef: SlideInRef<undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: ReportingExporterListComponent,
    imports: [],
    providers: [
      mockApi([
        mockCall('reporting.exporters.query', exporters),
        mockCall('reporting.exporters.delete'),
        mockCall('reporting.exporters.update'),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('shows accurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Reporting Exporters');
  });

  it('opens exporter form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(ReportingExportersFormComponent);
  });

  it('opens reporting exporters form when "Edit" button is pressed', async () => {
    const editButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'mdi-pencil' }));
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(ReportingExportersFormComponent, {
      data: exporters[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'mdi-delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Delete Reporting Exporter',
      message: 'Are you sure you want to delete <b>test</b> Reporting Exporter?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('reporting.exporters.delete', [1]);
  });

  it('updates a reporting exporter when Enabled toggle is toggled', async () => {
    const toggle = await loader.getHarness(TnSlideToggleHarness);
    await toggle.toggle();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('reporting.exporters.update', [
      1,
      { enabled: false },
    ]);
  });

  it('should show table rows', async () => {
    const headerTexts = await table.getHeaderTexts();
    const rowTexts = await table.getAllRowTexts();

    expect(headerTexts).toEqual(['Name', 'Type', 'Enabled', '']);
    expect(rowTexts).toEqual([['test', ReportingExporterKey.Graphite, '', '']]);
  });

  it('synthesizes per-row test IDs from the exporter name', () => {
    expect(spectator.query('[data-test="text-name-reporting-exporter-test-row-text"]')).toExist();
    expect(spectator.query('[data-test="text-type-reporting-exporter-test-row-text"]')).toExist();
    expect(spectator.query('[data-test="toggle-enabled-reporting-exporter-test-row-toggle"]')).toExist();
    expect(spectator.query('[data-test="button-edit-reporting-exporter-test-row-action"]')).toExist();
    expect(spectator.query('[data-test="button-delete-reporting-exporter-test-row-action"]')).toExist();
  });
});
