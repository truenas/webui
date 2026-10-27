import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormBuilder, Validators } from '@angular/forms';
import { createHostFactory, SpectatorHost, mockProvider } from '@ngneat/spectator/jest';
import { TnFormFieldHarness, TnInputHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';
import {
  createNamespaceForm, NamespaceFormGroup,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-form.utils';
import {
  getNamespacePathPicker, getNamespaceTypeToggle, mockCreateZvolAction, selectNamespaceType,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/testing/namespace-form.testing';
import { FilesystemService } from 'app/services/filesystem.service';

describe('BaseNamespaceFormComponent', () => {
  let spectator: SpectatorHost<BaseNamespaceFormComponent>;
  let loader: HarnessLoader;
  let form: NamespaceFormGroup;

  const getTnInput = (name: string): Promise<TnInputHarness> => loader.getHarness(
    TnInputHarness.with({ selector: `[formControlName="${name}"]` }),
  );

  // The group is owned by the host (the real wrappers build it with createNamespaceForm) and handed
  // over as an input, so the spec host mirrors that rather than wrapping anything in a <form>.
  const createHost = createHostFactory({
    component: BaseNamespaceFormComponent,
    overrideComponents: [mockCreateZvolAction()],
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
      '<ix-base-namespace-form [group]="form" [namespace]="namespace"></ix-base-namespace-form>',
      { hostProps: { form, namespace } },
    );
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  };

  describe('creation', () => {
    beforeEach(() => setupHost());

    it('writes a zvol path into the host form group', async () => {
      await selectNamespaceType(loader, 'Zvol');
      await (await getNamespacePathPicker(loader)).setValue('/dev/zvol/tank/test-zvol');

      expect(form.getRawValue()).toMatchObject({
        device_path: '/dev/zvol/tank/test-zvol',
      });
    });

    it('shows filename and file size only for a new file', async () => {
      await selectNamespaceType(loader, 'Existing File');
      expect(await loader.getAllHarnesses(TnInputHarness.with({ selector: '[formControlName="filename"]' })))
        .toHaveLength(0);

      await selectNamespaceType(loader, 'New File');
      await (await getNamespacePathPicker(loader)).setValue('/mnt/tank');
      await (await getTnInput('filename')).setValue('new-file.img');

      expect(form.getRawValue()).toMatchObject({
        device_path: '/mnt/tank',
        filename: 'new-file.img',
      });
    });

    // Regression: visiting New File used to leave the group permanently INVALID — Save stayed
    // disabled on every other device type. `syncNewFileControls` is what fixes it; see its doc
    // for the two independent causes it covers.
    it('stays valid on another device type after New File has been visited', async () => {
      await selectNamespaceType(loader, 'New File');
      expect(form.status).toBe('INVALID');

      await selectNamespaceType(loader, 'Existing File');
      await (await getNamespacePathPicker(loader)).setValue('/mnt/tank/test-file');

      expect(form.status).toBe('VALID');
      expect(form.controls.filename.disabled).toBe(true);
      expect(form.controls.filesize.disabled).toBe(true);
    });

    it('still requires filename and file size while New File is selected', async () => {
      await selectNamespaceType(loader, 'New File');
      await (await getNamespacePathPicker(loader)).setValue('/mnt/tank');
      expect(form.status).toBe('INVALID');

      await (await getTnInput('filename')).setValue('new-file.img');
      await (await getTnInput('filesize')).setValue('1024 MiB');

      expect(form.status).toBe('VALID');
    });

    // Pinned on both sides of the inference: the validator is what `tn-form-field` reads, and the
    // rendered required indicator is where that has to land for users. Dropping the factory's
    // validator breaks both halves. Every control here sits in its own `tn-form-field`, so the
    // count of required fields is the count of required controls.
    it.each([
      ['Zvol', ['device_path']],
      ['Existing File', ['device_path']],
      ['New File', ['device_path', 'filename', 'filesize']],
    ])('marks every required control as required on %s', async (type, expectedControls) => {
      await selectNamespaceType(loader, type);

      expectedControls.forEach((name) => {
        const control = form.controls[name as keyof NamespaceFormGroup['controls']];
        expect(control.hasValidator(Validators.required)).toBe(true);
        expect(control.enabled).toBe(true);
      });

      const fields = await loader.getAllHarnesses(TnFormFieldHarness);
      const required = await parallel(() => fields.map((field) => field.isRequired()));
      expect(required.filter(Boolean)).toHaveLength(expectedControls.length);
    });

    it('clears a previously chosen path when the device type changes', async () => {
      await selectNamespaceType(loader, 'Existing File');
      await (await getNamespacePathPicker(loader)).setValue('/mnt/tank/test-file');
      expect(form.getRawValue().device_path).toBe('/mnt/tank/test-file');

      await selectNamespaceType(loader, 'Zvol');

      expect(form.getRawValue().device_path).toBe('');
    });
  });

  describe('edits', () => {
    beforeEach(() => setupHost({
      device_type: NvmeOfNamespaceType.Zvol,
      device_path: 'zvol/tank/test-zvol',
      filesize: 512 * MiB,
    } as NvmeOfNamespace));

    it('prefills the host form group from an existing namespace', async () => {
      const checkedToggle = await getNamespaceTypeToggle(loader, 'Zvol');
      expect(await checkedToggle.isChecked()).toBe(true);

      expect(await (await getNamespacePathPicker(loader)).getValue()).toBe('zvol/tank/test-zvol');
    });

    // The prefill must not seed New File's fields: switching branches would otherwise show the old
    // namespace's size beside a blank filename, and `toNamespaceChanges` reads `getRawValue()`.
    it('does not carry the existing filesize into the New File branch', async () => {
      await selectNamespaceType(loader, 'New File');

      expect(form.getRawValue().filesize).toBeNull();
      expect(form.getRawValue().filename).toBe('');
    });
  });
});
