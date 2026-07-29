import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
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

  const slideInRef: SlideInRef<KerberosKeytab | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
  };

  const createComponent = createComponentFactory({
    component: KerberosKeytabsFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(SlideIn),
      mockProvider(StorageService),
      mockProvider(DialogService),
      mockProvider(SlideInRef, slideInRef),
      mockApi([
        mockCall('kerberos.keytab.create'),
        mockCall('kerberos.keytab.update'),
      ]),
      mockAuth(),
    ],
  });

  describe('Create Kerberos Keytab', () => {
    beforeEach(() => {
      spectator = createComponent();

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows empty values when form is opened for add', async () => {
      const nameInput = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
      expect(await nameInput.getValue()).toBe('');
    });
  });

  describe('Edit Kerberos Keytab', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => existingKerberosKeytabs) }),
        ],
      });

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    });

    it('shows values for an existing kerberos keytabs when form is opened for edit', async () => {
      const nameInput = await loader.getHarness(TnInputHarness.with({ name: 'name' }));
      expect(await nameInput.getValue()).toBe('test_name');
    });
  });
});
