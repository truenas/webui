import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form/kerberos-keytabs-form.component';
import { StorageService } from 'app/services/storage.service';

describe('KerberosKeytabsFormComponent', () => {
  let spectator: Spectator<KerberosKeytabsFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const existingKerberosKeytabs = {
    id: 123,
    name: 'test_name',
    file: '',
  } as KerberosKeytab;

  const slideInRef: SlideInRef<KerberosKeytab | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: KerberosKeytabsFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(SlideIn, {
        components$: of([]),
      }),
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
    beforeEach(async () => {
      spectator = createComponent();

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows values for an existing kerberos keytabs when form is opened for add', async () => {
      const values = await form.getValues();
      expect(values).toEqual({
        Name: '',
        'Kerberos Keytab': [],
      });
    });
  });

  describe('Edit Kerberos Keytab', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => existingKerberosKeytabs) }),
        ],
      });

      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('shows values for an existing kerberos keytabs when form is opened for edit', async () => {
      const values = await form.getValues();
      expect(values).toEqual({
        Name: 'test_name',
        'Kerberos Keytab': [],
      });
    });
  });
});
