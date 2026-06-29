import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormGroup, ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
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
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import {
  BaseNamespaceFormComponent, FormNamespaceType,
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

  async function clickSave(): Promise<void> {
    const saveButton = await loader.getHarness(TnButtonHarness.with({ label: 'Save' }));
    await saveButton.click();
  }

  // device_type changes clear device_path (clearPathOnTypeChanges), so set the
  // type first, then the path.
  function fillType(type: FormNamespaceType, path: string): void {
    spectator.component.form.controls.device_type.setValue(type);
    spectator.detectChanges();
    spectator.component.form.controls.device_path.setValue(path);
    spectator.detectChanges();
  }

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    jest.spyOn(spectator.component.submitted, 'emit');
  });

  describe('creation', () => {
    it('emits new values for a Zvol when form is filled in', async () => {
      fillType(FormNamespaceType.Zvol, '/dev/zvol/tank/test-zvol');

      await clickSave();

      expect(spectator.component.submitted.emit).toHaveBeenCalledWith({
        device_path: 'zvol/tank/test-zvol',
        device_type: NvmeOfNamespaceType.Zvol,
        filesize: undefined,
      } as NamespaceChanges);
    });

    it('emits new values for an existing file when form is filled in', async () => {
      fillType(FormNamespaceType.ExistingFile, '/mnt/tank/test-file');

      await clickSave();

      expect(spectator.component.submitted.emit).toHaveBeenCalledWith({
        device_path: '/mnt/tank/test-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: undefined,
      } as NamespaceChanges);
    });

    it('emits new values for a new file when form is filled in', async () => {
      fillType(FormNamespaceType.NewFile, '/mnt/tank');
      spectator.component.form.controls.filename.setValue('new-file.img');
      spectator.component.form.controls.filesize.setValue(1024 * MiB);
      spectator.detectChanges();

      await clickSave();

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

    it('shows values for an existing namespace', () => {
      expect(spectator.component.form.controls.device_type.value).toBe(FormNamespaceType.Zvol);
      expect(spectator.component.form.controls.device_path.value).toBe('zvol/tank/test-zvol');
    });

    it('emits changed values when existing namespace is updated', async () => {
      fillType(FormNamespaceType.ExistingFile, '/mnt/tank/updated-file');

      await clickSave();

      expect(spectator.component.submitted.emit).toHaveBeenCalledWith({
        device_path: '/mnt/tank/updated-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: undefined,
      } as NamespaceChanges);
    });
  });
});
