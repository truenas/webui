import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnCheckboxHarness, TnInputHarness, TnSelectHarness,
} from '@truenas/ui-components';
import { throwError } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockTypedApi, mockTypedCall } from 'app/core/testing/utils/mock-typed-api.utils';
import { SchemaType } from 'app/enums/schema.enum';
import { ReportingExporter, ReportingExporterKey } from 'app/interfaces/reporting-exporters.interface';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { TypedApiService } from 'app/modules/websocket/typed-api/typed-api.service';
import { ReportingExportersFormComponent } from 'app/pages/reports-dashboard/components/exporters/reporting-exporters-form/reporting-exporters-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

describe('ReportingExportersFormComponent', () => {
  let spectator: Spectator<ReportingExportersFormComponent>;
  let loader: HarnessLoader;

  const existingExporter = {
    name: 'test',
    id: 123,
    attributes: {
      exporter_type: ReportingExporterKey.Graphite,
      destination_ip: 'destination_ip',
      namespace: 'namespace',
    },
    enabled: true,
  } as ReportingExporter;

  const createComponent = createComponentFactory({
    component: ReportingExportersFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockTypedApi([
        mockTypedCall('reporting.exporters.exporter_schemas', [{
          key: ReportingExporterKey.Graphite,
          schema: [
            {
              _name_: 'destination_ip',
              _required_: false,
              title: 'Destination IP',
              type: SchemaType.String,
            },
            {
              _name_: 'namespace',
              _required_: false,
              title: 'Namespace',
              type: SchemaType.String,
            },
          ],
        }]),
        mockTypedCall('reporting.exporters.create', null),
        mockTypedCall('reporting.exporters.update', null),
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

      const secretAccessKey = await loader.getHarness(TnInputHarness.with({ name: 'namespace' }));
      await secretAccessKey.setValue('abcd');
      const accessKeyId = await loader.getHarness(TnInputHarness.with({ name: 'destination_ip' }));
      await accessKeyId.setValue('abcde');

      const closeSpy = jest.spyOn(spectator.component.closed, 'emit');
      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('reporting.exporters.create', [{
        name: 'exporter1',
        enabled: true,
        attributes: {
          destination_ip: 'abcde',
          namespace: 'abcd',
          exporter_type: ReportingExporterKey.Graphite,
        },
      }]);
      expect(closeSpy).toHaveBeenCalledWith(true);
    });
  });

  describe('Schemas fail to load', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(TypedApiService, {
            call: jest.fn(() => throwError(() => new Error('Schemas unavailable'))),
          }),
          mockProvider(ErrorHandlerService),
        ],
      });
    });

    it('reports the failure to the host so the panel offers a retry', () => {
      expect(spectator.inject(ErrorHandlerService).showErrorModal).toHaveBeenCalled();
      expect(spectator.component.hasLoadFailed()).toBe(true);
    });

    it('keeps Save disabled even once the form is otherwise valid', () => {
      // Filled in directly: with no schemas there are no type options to pick through the harness.
      // The point is that validity alone is not enough — the latched load failure is what blocks
      // Save, so the user can never submit a form whose `attributes` controls were never built.
      // eslint-disable-next-line @typescript-eslint/dot-notation
      const form = spectator.component['form'];
      form.patchValue({ name: 'exporter1', type: ReportingExporterKey.Graphite });
      spectator.detectChanges();

      expect(form.valid).toBe(true);
      expect(spectator.component.canSubmit()).toBe(false);
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
      expect(spectator.inject(TypedApiService).call).toHaveBeenCalledWith('reporting.exporters.exporter_schemas');

      const typeSelect = await loader.getHarness(TnSelectHarness);
      const typeOptions = await typeSelect.getOptions();
      expect(typeOptions).toEqual(['GRAPHITE']);

      const nameInput = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
      expect(await nameInput.getValue()).toBe(existingExporter.name);
      expect(await nameInput.isDisabled()).toBe(false);

      expect(await typeSelect.getDisplayText()).toBe(existingExporter.attributes.exporter_type);
      expect(await typeSelect.isDisabled()).toBe(false);

      const enableCheckbox = await loader.getHarness(TnCheckboxHarness.with({ label: 'Enable' }));
      expect(await enableCheckbox.isChecked()).toBe(existingExporter.enabled);
      expect(await enableCheckbox.isDisabled()).toBe(false);

      const accessKeyId = await loader.getHarness(TnInputHarness.with({ name: 'destination_ip' }));
      expect(await accessKeyId.getValue()).toBe(existingExporter.attributes.destination_ip);
      expect(await accessKeyId.isDisabled()).toBe(false);

      const secretAccessKey = await loader.getHarness(TnInputHarness.with({ name: 'namespace' }));
      expect(await secretAccessKey.getValue()).toBe(existingExporter.attributes.namespace);
      expect(await secretAccessKey.isDisabled()).toBe(false);
    });

    it('edits exporter when form is submitted', async () => {
      jest.spyOn(console, 'warn').mockImplementation();

      const accessKeyId = await loader.getHarness(TnInputHarness.with({ name: 'destination_ip' }));
      await accessKeyId.setValue('efghi');

      const closeSpy = jest.spyOn(spectator.component.closed, 'emit');
      spectator.component.submit();
      await spectator.fixture.whenStable();

      expect(spectator.inject(TypedApiService).call).toHaveBeenLastCalledWith(
        'reporting.exporters.update',
        [
          123,
          {
            name: existingExporter.name,
            enabled: existingExporter.enabled,
            attributes: {
              namespace: existingExporter.attributes.namespace,
              destination_ip: 'efghi',
              exporter_type: ReportingExporterKey.Graphite,
            },
          },
        ],
      );
      expect(closeSpy).toHaveBeenCalledWith(true);
    });
  });
});
