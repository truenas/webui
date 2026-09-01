import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnFileInputHarness, TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ixFormTestingProviders } from 'app/modules/forms/ix-forms/testing/ix-form-testing.helpers';
import { ApiService } from 'app/modules/websocket/api.service';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form/kerberos-keytabs-form.component';
import { StorageService } from 'app/services/storage.service';

describe('KerberosKeytabsFormComponent', () => {
  let spectator: Spectator<KerberosKeytabsFormComponent>;
  let loader: HarnessLoader;

  const existingKerberosKeytabs = {
    id: 123,
    name: 'test_name',
    file: '',
  } as KerberosKeytab;

  const createComponent = createComponentFactory({
    component: KerberosKeytabsFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(StorageService),
      mockProvider(DialogService),
      mockApi([
        mockCall('kerberos.keytab.create'),
        mockCall('kerberos.keytab.update'),
      ]),
      mockAuth(),
      ...ixFormTestingProviders(),
    ],
  });

  /**
   * `TnFileInputHarness` exposes no `setValue`, so the selection is made the way the component
   * receives it in the browser: a native `change` carrying a `FileList`-shaped `target`.
   */
  const selectFile = (file: File): void => {
    const input = spectator.query('input[type="file"]');
    const event = new Event('change');
    Object.defineProperty(event, 'target', { value: { files: [file] } });
    input.dispatchEvent(event);
    spectator.detectChanges();
  };

  /** Submits and resolves once `<ix-form>` reports the save, which the file read makes async. */
  const submitAndWait = (): Promise<unknown> => {
    const closed = new Promise((resolve) => {
      spectator.component.closed.subscribe(resolve);
    });
    spectator.component.submit();
    return closed;
  };

  describe('Create Kerberos Keytab', () => {
    beforeEach(() => {
      spectator = createComponent();

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows empty values when form is opened for add', async () => {
      const nameInput = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
      expect(await nameInput.getValue()).toBe('');

      const fileInput = await loader.getHarness(TnFileInputHarness);
      expect(await fileInput.hasFile()).toBe(false);
    });

    it('creates a keytab when the form is submitted', async () => {
      const nameInput = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
      await nameInput.setValue('new_keytab');
      selectFile(new File(['abc'], 'krb5.keytab'));

      await submitAndWait();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('kerberos.keytab.create', [{
        name: 'new_keytab',
        file: btoa('abc'),
      }]);
    });
  });

  describe('Edit Kerberos Keytab', () => {
    beforeEach(() => {
      spectator = createComponent({ props: { editingRow: existingKerberosKeytabs } });

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows values for an existing kerberos keytabs when form is opened for edit', async () => {
      const nameInput = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
      expect(await nameInput.getValue()).toBe('test_name');
    });

    it('updates the existing keytab when the form is submitted', async () => {
      selectFile(new File(['abc'], 'krb5.keytab'));

      await submitAndWait();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('kerberos.keytab.update', [
        123,
        { name: 'test_name', file: btoa('abc') },
      ]);
    });
  });
});
