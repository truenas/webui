import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { KerberosRealm } from 'app/interfaces/kerberos-realm.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { KerberosRealmsFormComponent } from 'app/pages/directory-service/components/kerberos-realms-form/kerberos-realms-form.component';

describe('KerberosRealmsFormComponent', () => {
  let spectator: Spectator<KerberosRealmsFormComponent>;
  let loader: HarnessLoader;
  let api: ApiService;

  const editingRealm = {
    id: 13,
    realm: 'existing',
    kdc: ['center1', 'center2'],
    admin_server: ['10.1.12.1', '10.1.12.2'],
    kpasswd_server: ['10.2.30.1', '10.2.30.2'],
  } as KerberosRealm;

  const slideInRef: SlideInRef<KerberosRealm | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn(() => undefined),
  };

  const createComponent = createComponentFactory({
    component: KerberosRealmsFormComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('kerberos.realm.create'),
        mockCall('kerberos.realm.update'),
      ]),
      mockProvider(SlideIn, {
        components$: of([]),
      }),
      mockProvider(FormErrorHandlerService),
      mockProvider(SlideInRef, slideInRef),
      mockAuth(),
    ],
  });

  describe('adding a new kerberos realm', () => {
    beforeEach(() => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('sends a create payload to websocket and closes modal form is saved', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Realm: 'new',
        KDC: ['kdc1', 'kdc2'],
        'Admin Servers': ['10.10.12.1', '10.10.12.2'],
        'Password Servers': ['10.10.30.1', '10.10.30.2'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('kerberos.realm.create', [{
        realm: 'new',
        kdc: ['kdc1', 'kdc2'],
        admin_server: ['10.10.12.1', '10.10.12.2'],
        kpasswd_server: ['10.10.30.1', '10.10.30.2'],
      }]);
    });
  });

  describe('editing a kerberos realm', () => {
    beforeEach(() => {
      spectator = createComponent({
        providers: [
          mockProvider(SlideInRef, { ...slideInRef, getData: jest.fn(() => editingRealm) }),
        ],
      });
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      api = spectator.inject(ApiService);
    });

    it('shows current group values when form is being edited', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        Realm: 'existing',
        KDC: ['center1', 'center2'],
        'Admin Servers': ['10.1.12.1', '10.1.12.2'],
        'Password Servers': ['10.2.30.1', '10.2.30.2'],
      });
    });

    it('sends an update payload to websocket when save is pressed', async () => {
      const form = await loader.getHarness(IxFormHarness);
      await form.fillForm({
        Realm: 'updated',
        KDC: ['center3', 'center4'],
        'Admin Servers': ['10.10.12.1'],
        'Password Servers': ['10.120.30.1'],
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(api.call).toHaveBeenCalledWith('kerberos.realm.update', [
        13,
        {
          realm: 'updated',
          admin_server: ['10.10.12.1'],
          kdc: ['center3', 'center4'],
          kpasswd_server: ['10.120.30.1'],
        },
      ]);
    });
  });
});
