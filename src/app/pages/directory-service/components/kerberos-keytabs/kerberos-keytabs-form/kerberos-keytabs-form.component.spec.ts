import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxFormHarness } from 'app/modules/ix-forms/testing/ix-form.harness';
import { KerberosKeytabsFormComponent } from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form/kerberos-keytabs-form.component';
import { StorageService } from 'app/services';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

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
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockProvider(StorageService),
      mockWebsocket([
        mockCall('kerberos.keytab.create'),
        mockCall('kerberos.keytab.update'),
      ]),
    ],
  });

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

  it('shows values for an existing kerberos keytabs when form is opened for edit', async () => {
    spectator.component.setKerberosKeytabsForEdit(existingKerberosKeytabs);

    const values = await form.getValues();
    expect(values).toEqual({
      Name: 'test_name',
      'Kerberos Keytab': [],
    });
  });
});
