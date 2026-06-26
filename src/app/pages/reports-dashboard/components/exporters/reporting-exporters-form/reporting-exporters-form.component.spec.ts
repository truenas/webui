import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { mockProvider, Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SchemaType } from 'app/enums/schema.enum';
import { ReportingExporter, ReportingExporterKey } from 'app/interfaces/reporting-exporters.interface';
import { Schema } from 'app/interfaces/schema.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
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

  const slideInRef: SlideInRef<ReportingExporter | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
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
      ...ixFormTestingProviders(),
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
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => existingExporter) }),
        ],
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
