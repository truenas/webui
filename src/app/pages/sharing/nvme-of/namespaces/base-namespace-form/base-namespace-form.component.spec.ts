import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { createHostFactory, SpectatorHost, mockProvider } from '@ngneat/spectator/jest';
import { TnButtonToggleHarness, TnInputHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import {
  ExplorerCreateZvolComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-zvol/explorer-create-zvol.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';
import {
  createNamespaceForm, NamespaceFormGroup,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-form.utils';
import { FilesystemService } from 'app/services/filesystem.service';

describe('BaseNamespaceFormComponent', () => {
  let spectator: SpectatorHost<BaseNamespaceFormComponent>;
  let loader: HarnessLoader;
  let form: NamespaceFormGroup;

  const getTnInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  // A checked toggle's label text is prefixed with the tn-button-toggle "✓" marker,
  // so match the option text loosely via regex rather than an exact string.
  const selectType = async (label: string): Promise<void> => {
    const toggle = await loader.getHarness(TnButtonToggleHarness.with({ label: new RegExp(label) }));
    await toggle.check();
  };

  // The group is owned by the host (the real wrappers build it with createNamespaceForm), so the
  // component is rendered inside a form element that supplies the ControlContainer.
  const createHost = createHostFactory({
    component: BaseNamespaceFormComponent,
    imports: [
      ReactiveFormsModule,
      MockComponent(ExplorerCreateZvolComponent),
    ],
    providers: [
      mockProvider(AuthService, {
        hasRole: jest.fn(() => of(true)),
      }),
      mockProvider(FilesystemService),
    ],
  });

  const setupHost = (namespace?: NvmeOfNamespace): void => {
    form = createNamespaceForm(new FormBuilder().nonNullable);
    spectator = createHost(
      `<form [formGroup]="form">
        <ix-base-namespace-form [form]="form" [namespace]="namespace"></ix-base-namespace-form>
      </form>`,
      { hostProps: { form, namespace } },
    );
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  };

  describe('creation', () => {
    beforeEach(() => setupHost());

    it('writes a zvol path into the host form group', async () => {
      await selectType('Zvol');
      const ixForm = await loader.getHarness(IxFormHarness);
      await ixForm.fillForm({
        'Path To Zvol': '/dev/zvol/tank/test-zvol',
      });

      expect(form.getRawValue()).toMatchObject({
        device_path: '/dev/zvol/tank/test-zvol',
      });
    });

    it('shows filename and file size only for a new file', async () => {
      await selectType('Existing File');
      expect(await loader.getAllHarnesses(TnInputHarness.with({ selector: '[formControlName="filename"]' })))
        .toHaveLength(0);

      await selectType('New File');
      const ixForm = await loader.getHarness(IxFormHarness);
      await ixForm.fillForm({
        'Parent Directory': '/mnt/tank',
      });
      await (await getTnInput('filename')).setValue('new-file.img');

      expect(form.getRawValue()).toMatchObject({
        device_path: '/mnt/tank',
        filename: 'new-file.img',
      });
    });

    // Regression: the New File branch's tn-inputs contribute `required` validators that Angular
    // does not strip when the branch is destroyed, so visiting New File used to leave the group
    // permanently INVALID — Save stayed disabled on every other device type.
    it('stays valid on another device type after New File has been visited', async () => {
      await selectType('New File');
      expect(form.status).toBe('INVALID');

      await selectType('Existing File');
      const ixForm = await loader.getHarness(IxFormHarness);
      await ixForm.fillForm({
        'Path To File': '/mnt/tank/test-file',
      });

      expect(form.status).toBe('VALID');
      expect(form.controls.filename.disabled).toBe(true);
      expect(form.controls.filesize.disabled).toBe(true);
    });

    it('still requires filename and file size while New File is selected', async () => {
      await selectType('New File');
      const ixForm = await loader.getHarness(IxFormHarness);
      await ixForm.fillForm({
        'Parent Directory': '/mnt/tank',
      });
      expect(form.status).toBe('INVALID');

      await (await getTnInput('filename')).setValue('new-file.img');
      await (await getTnInput('filesize')).setValue('1024 MiB');

      expect(form.status).toBe('VALID');
    });

    // The `*` is inferred from `Validators.required` on the control (tn-form-field) / the
    // explorer's own `[required]` input — NOT from `tn-input [required]`, which only renders the
    // native attribute. Assert the rendered indicator so that distinction can't silently regress.
    it.each([
      ['Zvol', ['Path To Zvol']],
      ['Existing File', ['Path To File']],
      ['New File', ['Parent Directory', 'Filename', 'File Size']],
    ])('marks every required field with an indicator on %s', async (type, expectedLabels) => {
      await selectType(type);

      const starredLabels = spectator.queryAll('.required')
        .map((star) => star.parentElement?.textContent?.trim().replace(/\*$/, ''));

      expect(starredLabels).toEqual(expectedLabels);
    });

    it('clears a previously chosen path when the device type changes', async () => {
      await selectType('Existing File');
      const ixForm = await loader.getHarness(IxFormHarness);
      await ixForm.fillForm({
        'Path To File': '/mnt/tank/test-file',
      });
      expect(form.getRawValue().device_path).toBe('/mnt/tank/test-file');

      await selectType('Zvol');

      expect(form.getRawValue().device_path).toBe('');
    });
  });

  describe('edits', () => {
    beforeEach(() => setupHost({
      device_type: NvmeOfNamespaceType.Zvol,
      device_path: 'zvol/tank/test-zvol',
    } as NvmeOfNamespace));

    it('prefills the host form group from an existing namespace', async () => {
      const checkedToggle = await loader.getHarness(TnButtonToggleHarness.with({ label: /Zvol/ }));
      expect(await checkedToggle.isChecked()).toBe(true);

      const ixForm = await loader.getHarness(IxFormHarness);
      expect(await ixForm.getValues()).toEqual({
        'Path To Zvol': 'zvol/tank/test-zvol',
      });
    });
  });
});
