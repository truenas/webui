import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { mockProvider, Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SchemaType } from 'app/enums/schema.enum';
import { ReportingExporter, ReportingExporterKey } from 'app/interfaces/reporting-exporters.interface';
import { Schema } from 'app/interfaces/schema.interface';
import { IxDynamicFormModule } from 'app/modules/ix-dynamic-form/ix-dynamic-form.module';
import { IxSelectHarness } from 'app/modules/ix-forms/components/ix-select/ix-select.harness';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { ReportingExportersFormComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-form/reporting-exporters-form.component';
import { WebSocketService } from 'app/services/ws.service';

describe('ReportingExportersFormComponent', () => {
  let spectator: Spectator<ReportingExportersFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const existingExporter: ReportingExporter = {
    name: 'test',
    id: 123,
    type: ReportingExporterKey.Graphite,
    attributes: {
      access_key_id: 'access_key_id',
      secret_access_key: 'secret_access_key',
    },
    enabled: true,
  };

  const createComponent = createComponentFactory({
    component: ReportingExportersFormComponent,
    imports: [
      IxFormsModule,
      IxDynamicFormModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(IxSlideInRef),
      mockWebsocket([
        mockCall('reporting.exporters.exporter_schemas', [{
          key: ReportingExporterKey.Graphite,
          schema: [
            {
              _name_: 'access_key_id',
              _required_: false,
              title: 'Access Key Id',
              type: SchemaType.String,
            },
            {
              _name_: 'secret_access_key',
              _required_: false,
              title: 'Secret Access Key Id',
              type: SchemaType.String,
            },
          ] as Schema[],
        }]),
        mockCall('reporting.exporters.create'),
        mockCall('reporting.exporters.update'),
      ]),
      mockProvider(FormErrorHandlerService),
      {
        provide: SLIDE_IN_DATA,
        useValue: undefined,
      },
    ],
  });

  describe('Add new exporter', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('add new exporter when form is submitted', async () => {

      await form.fillForm({
        Name: 'exporter1',
        Type: ReportingExporterKey.Graphite,
        Enable: true,
      });

      await form.fillForm({
        'Secret access key id': 'abcd',
        'Access key id': 'abcde',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));

      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('reporting.exporters.create', [{
        name: 'exporter1',
        type: ReportingExporterKey.Graphite,
        enabled: true,
        attributes: {
          access_key_id: 'abcde',
          secret_access_key: 'abcd',
        },
      }]);
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
    });
  });

  describe('Edit exporter', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          { provide: SLIDE_IN_DATA, useValue: existingExporter },
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows values for existing exporter', async () => {
      expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('reporting.exporters.exporter_schemas');

      const typeSelect = await loader.getHarness(IxSelectHarness.with({ label: 'Type' }));
      const typeOptions = await typeSelect.getOptionLabels();
      expect(typeOptions).toEqual([
        'GRAPHITE',
      ]);

      const values = await form.getValues();
      const disabledState = await form.getDisabledState();

      expect(values).toEqual({
        Name: existingExporter.name,
        Type: existingExporter.type,
        Enable: existingExporter.enabled,
        'Secret access key id': existingExporter.attributes.secret_access_key,
        'Access key id': existingExporter.attributes.access_key_id,
      });

      expect(disabledState).toEqual({
        Name: false,
        Type: false,
        'Access key id': false,
        'Secret access key id': false,
        Enable: false,
      });
    });

    it('edits exporter when form is submitted', async () => {
      await form.fillForm({
        'Access key id': 'efghi',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(WebSocketService).call).toHaveBeenLastCalledWith(
        'reporting.exporters.update', [
          123,
          {
            name: existingExporter.name,
            enabled: existingExporter.enabled,
            attributes: {
              secret_access_key: existingExporter.attributes.secret_access_key,
              access_key_id: 'efghi',
            },
          },
        ],
      );
      expect(spectator.inject(IxSlideInRef).close).toHaveBeenCalled();
    });
  });
});