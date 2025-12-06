import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
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
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';
import { FilesystemService } from 'app/services/filesystem.service';

describe('BaseNamespaceFormComponent', () => {
  let spectator: Spectator<BaseNamespaceFormComponent>;
  let loader: HarnessLoader;
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
      mockProvider(SlideInRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    jest.spyOn(spectator.component.submitted, 'emit');
  });

  describe('creation', () => {
    it('emits new values for a Zvol when form is filled in', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Type: 'Zvol',
        'Path To Zvol': '/dev/zvol/tank/test-zvol',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.component.submitted.emit).toHaveBeenCalledWith({
        device_path: 'zvol/tank/test-zvol',
        device_type: NvmeOfNamespaceType.Zvol,
        filesize: undefined,
      } as NamespaceChanges);
    });

    it('emits new values for an existing file when form is filled in', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Type: 'Existing File',
        'Path To File': '/mnt/tank/test-file',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.component.submitted.emit).toHaveBeenCalledWith({
        device_path: '/mnt/tank/test-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: undefined,
      } as NamespaceChanges);
    });

    it('emits new values for a new file when form is filled in', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Type: 'New File',
        'Parent Directory': '/mnt/tank',
        Filename: 'new-file.img',
        'File Size': '1024 MiB',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

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
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Type: 'Zvol',
        'Path To Zvol': 'zvol/tank/test-zvol',
      });
    });

    it('emits changed values when existing namespace is updated', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Type: 'Existing File',
        'Path To File': '/mnt/tank/updated-file',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.component.submitted.emit).toHaveBeenCalledWith({
        device_path: '/mnt/tank/updated-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: undefined,
      } as NamespaceChanges);
    });
  });
});
