import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { TnButtonToggleHarness, TnInputHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import {
  ExplorerCreateZvolComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-zvol/explorer-create-zvol.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';
import { FilesystemService } from 'app/services/filesystem.service';

describe('BaseNamespaceFormComponent', () => {
  let spectator: Spectator<BaseNamespaceFormComponent>;
  let loader: HarnessLoader;

  const getTnInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  // A checked toggle's label text is prefixed with the tn-button-toggle "✓" marker,
  // so match the option text loosely via regex rather than an exact string.
  const selectType = async (label: string): Promise<void> => {
    const toggle = await loader.getHarness(TnButtonToggleHarness.with({ label: new RegExp(label) }));
    await toggle.check();
  };

  const createComponent = createComponentFactory({
    component: BaseNamespaceFormComponent,
    imports: [
      ReactiveFormsModule,
      MockComponent(ExplorerCreateZvolComponent),
    ],
    providers: [
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(FilesystemService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    jest.spyOn(spectator.component.submitted, 'emit');
  });

  describe('creation', () => {
    it('emits new values for a Zvol when form is filled in', async () => {
      await selectType('Zvol');
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Path To Zvol': '/dev/zvol/tank/test-zvol',
      });

      spectator.component.submit();

      expect(spectator.component.submitted.emit).toHaveBeenCalledWith({
        device_path: 'zvol/tank/test-zvol',
        device_type: NvmeOfNamespaceType.Zvol,
        filesize: undefined,
      } as NamespaceChanges);
    });

    it('emits new values for an existing file when form is filled in', async () => {
      await selectType('Existing File');
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Path To File': '/mnt/tank/test-file',
      });

      spectator.component.submit();

      expect(spectator.component.submitted.emit).toHaveBeenCalledWith({
        device_path: '/mnt/tank/test-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: undefined,
      } as NamespaceChanges);
    });

    it('emits new values for a new file when form is filled in', async () => {
      await selectType('New File');
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Parent Directory': '/mnt/tank',
      });
      await (await getTnInput('filename')).setValue('new-file.img');
      await (await getTnInput('filesize')).setValue('1024 MiB');

      spectator.component.submit();

      expect(spectator.component.submitted.emit).toHaveBeenCalledWith({
        device_path: '/mnt/tank/new-file.img',
        device_type: NvmeOfNamespaceType.File,
        filesize: 1024 * MiB,
      } as NamespaceChanges);
    });

    it('shows errors when they are provided in the input', () => {
      const mockError = {
        device_path: 'This field is required',
      };
      spectator.setInput('error', mockError);
      spectator.detectChanges();

      expect(spectator.inject(FormErrorHandlerService).handleValidationErrors)
        .toHaveBeenCalledWith(mockError, expect.any(FormGroup));
    });
  });

  describe('edits', () => {
    beforeEach(() => {
      const mockNamespace = {
        device_type: NvmeOfNamespaceType.Zvol,
        device_path: 'zvol/tank/test-zvol',
      } as NvmeOfNamespace;

      spectator = createComponent({
        props: {
          namespace: mockNamespace,
        },
      });

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      jest.spyOn(spectator.component.submitted, 'emit');
    });

    it('shows values for an existing namespace', async () => {
      const checkedToggle = await loader.getHarness(TnButtonToggleHarness.with({ label: /Zvol/ }));
      expect(await checkedToggle.isChecked()).toBe(true);

      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        'Path To Zvol': 'zvol/tank/test-zvol',
      });
    });

    it('emits changed values when existing namespace is updated', async () => {
      await selectType('Existing File');
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        'Path To File': '/mnt/tank/updated-file',
      });

      spectator.component.submit();

      expect(spectator.component.submitted.emit).toHaveBeenCalledWith({
        device_path: '/mnt/tank/updated-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: undefined,
      } as NamespaceChanges);
    });
  });
});
