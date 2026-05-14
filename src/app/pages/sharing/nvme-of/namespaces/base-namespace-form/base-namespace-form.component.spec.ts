import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
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
import { SubmitResult } from 'app/modules/forms/ix-forms/components/ix-form/ix-form.component';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TranslatedString } from 'app/modules/translate/translate.helper';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';
import { FilesystemService } from 'app/services/filesystem.service';

describe('BaseNamespaceFormComponent', () => {
  let spectator: Spectator<BaseNamespaceFormComponent>;
  let loader: HarnessLoader;
  let submitHandler: jest.Mock<SubmitResult, [NamespaceChanges]>;

  const createComponent = createComponentFactory({
    component: BaseNamespaceFormComponent,
    imports: [
      ReactiveFormsModule,
      MockComponent(ExplorerCreateZvolComponent),
    ],
    providers: [
      ...ixFormTestingProviders(),
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
      }),
      mockProvider(FilesystemService),
      mockProvider(SlideInRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
        getData: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    submitHandler = jest.fn<SubmitResult, [NamespaceChanges]>(() => ({
      request$: of(undefined),
      successMessage: 'Saved!' as TranslatedString,
    }));
    spectator = createComponent({
      props: { submitHandler },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  describe('creation', () => {
    it('invokes submitHandler with the Zvol payload', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Type: 'Zvol',
        'Path To Zvol': '/dev/zvol/tank/test-zvol',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandler).toHaveBeenCalledWith({
        device_path: 'zvol/tank/test-zvol',
        device_type: NvmeOfNamespaceType.Zvol,
        filesize: undefined,
      } as NamespaceChanges);
    });

    it('invokes submitHandler with the existing-file payload', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Type: 'Existing File',
        'Path To File': '/mnt/tank/test-file',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandler).toHaveBeenCalledWith({
        device_path: '/mnt/tank/test-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: undefined,
      } as NamespaceChanges);
    });

    it('invokes submitHandler with the new-file payload', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Type: 'New File',
        'Parent Directory': '/mnt/tank',
        Filename: 'new-file.img',
        'File Size': '1024 MiB',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandler).toHaveBeenCalledWith({
        device_path: '/mnt/tank/new-file.img',
        device_type: NvmeOfNamespaceType.File,
        filesize: 1024 * MiB,
      } as NamespaceChanges);
    });
  });

  describe('edits', () => {
    beforeEach(() => {
      const mockNamespace = {
        device_type: NvmeOfNamespaceType.Zvol,
        device_path: 'zvol/tank/test-zvol',
      } as NvmeOfNamespace;

      submitHandler = jest.fn<SubmitResult, [NamespaceChanges]>(() => ({
        request$: of(undefined),
        successMessage: 'Saved!' as TranslatedString,
      }));
      spectator = createComponent({
        props: { namespace: mockNamespace, submitHandler },
      });

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows values for an existing namespace', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Type: 'Zvol',
        'Path To Zvol': 'zvol/tank/test-zvol',
      });
    });

    it('invokes submitHandler with the updated payload', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Type: 'Existing File',
        'Path To File': '/mnt/tank/updated-file',
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(submitHandler).toHaveBeenCalledWith({
        device_path: '/mnt/tank/updated-file',
        device_type: NvmeOfNamespaceType.File,
        filesize: undefined,
      } as NamespaceChanges);
    });
  });
});
