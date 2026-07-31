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
  selectNamespaceType,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-form.testing';
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

  // The group is owned by the host (the real wrappers build it with createNamespaceForm), so the
  // component is rendered inside a form element that supplies the ControlContainer.
  const createHost = createHostFactory({
    component: BaseNamespaceFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    overrideComponents: [
      // BaseNamespaceFormComponent is standalone, so its own `imports` define the template scope —
      // listing a mock in the TestBed module would NOT replace the real child. Override the
      // component's own import array instead, or the real explorer button renders (pulling in the
      // real FormSidePanelService) while the spec reads as though it were stubbed.
      [BaseNamespaceFormComponent, {
        remove: { imports: [ExplorerCreateZvolComponent] },
        add: { imports: [MockComponent(ExplorerCreateZvolComponent)] },
      }],
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
        <ix-base-namespace-form [namespace]="namespace"></ix-base-namespace-form>
      </form>`,
      { hostProps: { form, namespace } },
    );
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  };

  describe('creation', () => {
    beforeEach(() => setupHost());

    it('writes a zvol path into the host form group', async () => {
      await selectNamespaceType(loader, 'Zvol');
      const ixForm = await loader.getHarness(IxFormHarness);
      await ixForm.fillForm({
        'Path To Zvol': '/dev/zvol/tank/test-zvol',
      });

      expect(form.getRawValue()).toMatchObject({
        device_path: '/dev/zvol/tank/test-zvol',
      });
    });

    it('shows filename and file size only for a new file', async () => {
      await selectNamespaceType(loader, 'Existing File');
      expect(await loader.getAllHarnesses(TnInputHarness.with({ selector: '[formControlName="filename"]' })))
        .toHaveLength(0);

      await selectNamespaceType(loader, 'New File');
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

    // Regression: visiting New File used to leave the group permanently INVALID — Save stayed
    // disabled on every other device type. `syncNewFileControls` is what fixes it; see its doc
    // for the two independent causes it covers.
    it('stays valid on another device type after New File has been visited', async () => {
      await selectNamespaceType(loader, 'New File');
      expect(form.status).toBe('INVALID');

      await selectNamespaceType(loader, 'Existing File');
      const ixForm = await loader.getHarness(IxFormHarness);
      await ixForm.fillForm({
        'Path To File': '/mnt/tank/test-file',
      });

      expect(form.status).toBe('VALID');
      expect(form.controls.filename.disabled).toBe(true);
      expect(form.controls.filesize.disabled).toBe(true);
    });

    it('still requires filename and file size while New File is selected', async () => {
      await selectNamespaceType(loader, 'New File');
      const ixForm = await loader.getHarness(IxFormHarness);
      await ixForm.fillForm({
        'Parent Directory': '/mnt/tank',
      });
      expect(form.status).toBe('INVALID');

      await (await getTnInput('filename')).setValue('new-file.img');
      await (await getTnInput('filesize')).setValue('1024 MiB');

      expect(form.status).toBe('VALID');
    });

    // Both the `*` and `aria-required` are inferred from `Validators.required` on the control —
    // the tn-inputs deliberately carry no `[required]` binding (see `syncNewFileControls`). This
    // is what pins that: drop the factory's validator and both disappear together.
    //
    // `.required` is library-internal markup, so match on set membership + count rather than an
    // exact ordered array — DOM order and sibling structure are not what this test is about.
    it.each([
      ['Zvol', ['Path To Zvol']],
      ['Existing File', ['Path To File']],
      ['New File', ['Parent Directory', 'Filename', 'File Size']],
    ])('marks every required field as required on %s', async (type, expectedLabels) => {
      await selectNamespaceType(loader, type);

      const starredLabels = spectator.queryAll('.required')
        .map((star) => star.parentElement?.textContent?.replace(/\*/g, '').trim());

      expect(starredLabels).toHaveLength(expectedLabels.length);
      expectedLabels.forEach((label) => expect(starredLabels).toContain(label));
      // The same inference has to reach assistive tech, not just the visual indicator.
      expect(spectator.queryAll('[aria-required="true"]')).toHaveLength(expectedLabels.length);
    });

    it('clears a previously chosen path when the device type changes', async () => {
      await selectNamespaceType(loader, 'Existing File');
      const ixForm = await loader.getHarness(IxFormHarness);
      await ixForm.fillForm({
        'Path To File': '/mnt/tank/test-file',
      });
      expect(form.getRawValue().device_path).toBe('/mnt/tank/test-file');

      await selectNamespaceType(loader, 'Zvol');

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
