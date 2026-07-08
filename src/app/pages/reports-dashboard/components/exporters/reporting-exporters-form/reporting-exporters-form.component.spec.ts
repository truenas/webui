import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SchemaType } from 'app/enums/schema.enum';
import { ReportingExporter, ReportingExporterKey } from 'app/interfaces/reporting-exporters.interface';
import { Schema } from 'app/interfaces/schema.interface';
import { ixFormMinSubmitFeedbackMs } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
import { ReportingExportersFormComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-form/reporting-exporters-form.component';

describe('ReportingExportersFormComponent', () => {
  let spectator: Spectator<ReportingExportersFormComponent>;
  let loader: HarnessLoader;

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

  const createComponent = createComponentFactory({
    component: ReportingExportersFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
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
      ...ixFormTestingProviders(),
      // Skip the min submit-feedback hold so the synchronous-close assertions below hold.
      { provide: ixFormMinSubmitFeedbackMs, useValue: 0 },
    ],
  });

  describe('Add new exporter', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('add new exporter when form is submitted', async () => {
      jest.spyOn(console, 'warn').mockImplementation();

      const nameInput = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
      await nameInput.setValue('exporter1');

      const typeSelect = await loader.getHarness(TnSelectHarness);
      await typeSelect.selectOption(ReportingExporterKey.Graphite);

      const secretAccessKey = await loader.getHarness(TnInputHarness.with({ name: 'secret_access_key' }));
      await secretAccessKey.setValue('abcd');
      const accessKeyId = await loader.getHarness(TnInputHarness.with({ name: 'access_key_id' }));
      await accessKeyId.setValue('abcde');

      const closeSpy = jest.spyOn(spectator.component.closed, 'emit');
      spectator.component.submit();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('reporting.exporters.create', [{
        name: 'exporter1',
        enabled: true,
        attributes: {
          access_key_id: 'abcde',
          secret_access_key: 'abcd',
          exporter_type: ReportingExporterKey.Graphite,
        },
      }]);
      expect(closeSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('Edit exporter', () => {
    beforeEach(() => {
      spectator = createComponent({
        props: { exporter: existingExporter },
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows values for existing exporter', async () => {
      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('reporting.exporters.exporter_schemas');

      const typeSelect = await loader.getHarness(TnSelectHarness);
      const typeOptions = await typeSelect.getOptions();
      expect(typeOptions).toEqual(['GRAPHITE']);

      const nameInput = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
      expect(await nameInput.getValue()).toBe(existingExporter.name);
      expect(await nameInput.isDisabled()).toBe(false);

      expect(await typeSelect.getDisplayText()).toBe(existingExporter.attributes.exporter_type as string);
      expect(await typeSelect.isDisabled()).toBe(false);

      const enableCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Enable' }));
      expect(await enableCheckbox.isChecked()).toBe(existingExporter.enabled);
      expect(await enableCheckbox.isDisabled()).toBe(false);

      const accessKeyId = await loader.getHarness(TnInputHarness.with({ name: 'access_key_id' }));
      expect(await accessKeyId.getValue()).toBe(existingExporter.attributes.access_key_id);
      expect(await accessKeyId.isDisabled()).toBe(false);

      const secretAccessKey = await loader.getHarness(TnInputHarness.with({ name: 'secret_access_key' }));
      expect(await secretAccessKey.getValue()).toBe(existingExporter.attributes.secret_access_key);
      expect(await secretAccessKey.isDisabled()).toBe(false);
    });

    it('edits exporter when form is submitted', async () => {
      jest.spyOn(console, 'warn').mockImplementation();

      const accessKeyId = await loader.getHarness(TnInputHarness.with({ name: 'access_key_id' }));
      await accessKeyId.setValue('efghi');

      const closeSpy = jest.spyOn(spectator.component.closed, 'emit');
      spectator.component.submit();

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
      expect(closeSpy).toHaveBeenCalledWith(true);
    });
  });
});
