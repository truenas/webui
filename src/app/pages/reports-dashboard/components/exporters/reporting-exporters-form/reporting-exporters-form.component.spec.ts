import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { mockProvider, Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SchemaType } from 'app/enums/schema.enum';
import { ReportingExporter, ReportingExporterKey } from 'app/interfaces/reporting-exporters.interface';
import { Schema } from 'app/interfaces/schema.interface';
import { IxSelectHarness } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.harness';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { ReportingExportersFormComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-form/reporting-exporters-form.component';

describe('ReportingExportersFormComponent', () => {
  let spectator: Spectator<ReportingExportersFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const existingExporter: ReportingExporter = {
    name: 'test',
    id: 123,
    attributes: {
      exporter_type: ReportingExporterKey.Graphite,
      access_key_id: 'access_key_id',
      secret_access_key: 'secret_access_key',
    },
    enabled: true,
  };

  const slideInRef: SlideInRef<ReportingExporter | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: ReportingExportersFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(SlideInRef, slideInRef),
      mockApi([
        mockCall('reporting.exporters.exporter_schemas', [{
          key: ReportingExporterKey.Graphite,
          schema: [
            {
              _name_: 'access_key_id',
              _required_: false,
              title: 'Access Key ID',
              type: SchemaType.String,
            },
            {
              _name_: 'secret_access_key',
              _required_: false,
              title: 'Secret Access Key ID',
              type: SchemaType.String,
            },
          ] as Schema[],
        }]),
        mockCall('reporting.exporters.create'),
        mockCall('reporting.exporters.update'),
      ]),
      mockAuth(),
      mockProvider(FormErrorHandlerService),
    ],
  });

  describe('Add new exporter', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('add new exporter when form is submitted', async () => {
      await form.fillForm(
        {
          Name: 'exporter1',
          Type: ReportingExporterKey.Graphite,
          Enable: true,
          'Secret Access Key ID': 'abcd',
          'Access Key ID': 'abcde',
        },
      );

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));

      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('reporting.exporters.create', [{
        name: 'exporter1',
        enabled: true,
        attributes: {
          access_key_id: 'abcde',
          secret_access_key: 'abcd',
          exporter_type: ReportingExporterKey.Graphite,
        },
      }]);
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('Edit exporter', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => existingExporter) }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows values for existing exporter', async () => {
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('reporting.exporters.exporter_schemas');

      const typeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Type' }));
      const typeOptions = await typeSelect.getOptionLabels();
      expect(typeOptions).toEqual([
        'GRAPHITE',
      ]);

      const values = await form.getValues();
      const disabledState = await form.getDisabledState();

      expect(values).toEqual({
        Name: existingExporter.name,
        Type: existingExporter.attributes.exporter_type,
        Enable: existingExporter.enabled,
        'Secret Access Key ID': existingExporter.attributes.secret_access_key,
        'Access Key ID': existingExporter.attributes.access_key_id,
      });

      expect(disabledState).toEqual({
        Name: false,
        Type: false,
        'Access Key ID': false,
        'Secret Access Key ID': false,
        Enable: false,
      });
    });

    it('edits exporter when form is submitted', async () => {
      await form.fillForm({
        'Access Key ID': 'efghi',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith(
        'reporting.exporters.update',
        [
          123,
          {
            name: existingExporter.name,
            enabled: existingExporter.enabled,
            attributes: {
              secret_access_key: existingExporter.attributes.secret_access_key,
              access_key_id: 'efghi',
              exporter_type: ReportingExporterKey.Graphite,
            },
          },
        ],
      );
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalled();
    });
  });
});
