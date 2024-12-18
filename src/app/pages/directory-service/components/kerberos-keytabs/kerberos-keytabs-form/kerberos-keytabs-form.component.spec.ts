import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { OldSlideInRef } from 'app/modules/slide-ins/old-slide-in-ref';
import { SLIDE_IN_DATA } from 'app/modules/slide-ins/slide-in.token';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form/kerberos-keytabs-form.component';
import { OldSlideInService } from 'app/services/old-slide-in.service';
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

  const createComponent = createComponentFactory({
    component: KerberosKeytabsFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(OldSlideInService),
      mockProvider(StorageService),
      mockProvider(DialogService),
      mockProvider(OldSlideInRef),
      { provide: SLIDE_IN_DATA, useValue: undefined },
      mockApi([
        mockCall('kerberos.keytab.create'),
        mockCall('kerberos.keytab.update'),
      ]),
      mockAuth(),
    ],
  });

  describe('Create Kerberos Keytab', () => {
    beforeEach(async () => {
      spectator = createComponent({
        providers: [{ provide: SLIDE_IN_DATA, useValue: null }],
      });

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
        providers: [{ provide: SLIDE_IN_DATA, useValue: existingKerberosKeytabs }],
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
