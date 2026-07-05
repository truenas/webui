import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnChipInputHarness, TnInputHarness } from '@truenas/ui-components';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { KerberosRealm } from 'app/interfaces/kerberos-realm.interface';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
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
    primary_kdc: 'primary_kdc',
  } as KerberosRealm;

  const slideInRef: SlideInRef<KerberosRealm | undefined, unknown> = {
    close: jest.fn(),
    requireConfirmationWhen: jest.fn(),
    getData: jest.fn((): undefined => undefined),
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

    it('sends a create payload to websocket and closes the form when saved', async () => {
      const realm = await loader.getHarness(TnInputHarness.with({ name: 'realm' }));
      await realm.setValue('new');
      const primaryKdc = await loader.getHarness(TnInputHarness.with({ name: 'primary_kdc' }));
      await primaryKdc.setValue('primary_kdc2');

      const kdc = await loader.getHarness(TnChipInputHarness.with({ testId: 'chip-input-kdc' }));
      await kdc.addChip('kdc1');
      await kdc.addChip('kdc2');

      const adminServers = await loader.getHarness(TnChipInputHarness.with({ testId: 'chip-input-admin-server' }));
      await adminServers.addChip('10.10.12.1');
      await adminServers.addChip('10.10.12.2');

      const passwordServers = await loader.getHarness(TnChipInputHarness.with({ testId: 'chip-input-kpasswd-server' }));
      await passwordServers.addChip('10.10.30.1');
      await passwordServers.addChip('10.10.30.2');

      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('kerberos.realm.create', [{
        realm: 'new',
        kdc: ['kdc1', 'kdc2'],
        admin_server: ['10.10.12.1', '10.10.12.2'],
        kpasswd_server: ['10.10.30.1', '10.10.30.2'],
        primary_kdc: 'primary_kdc2',
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

    it('shows current realm values when form is being edited', async () => {
      const realm = await loader.getHarness(TnInputHarness.with({ name: 'realm' }));
      const primaryKdc = await loader.getHarness(TnInputHarness.with({ name: 'primary_kdc' }));
      const kdc = await loader.getHarness(TnChipInputHarness.with({ testId: 'chip-input-kdc' }));
      const adminServers = await loader.getHarness(TnChipInputHarness.with({ testId: 'chip-input-admin-server' }));
      const passwordServers = await loader.getHarness(TnChipInputHarness.with({ testId: 'chip-input-kpasswd-server' }));

      expect(await realm.getValue()).toBe('existing');
      expect(await primaryKdc.getValue()).toBe('primary_kdc');
      expect(await kdc.getChips()).toEqual(['center1', 'center2']);
      expect(await adminServers.getChips()).toEqual(['10.1.12.1', '10.1.12.2']);
      expect(await passwordServers.getChips()).toEqual(['10.2.30.1', '10.2.30.2']);
    });

    it('sends an update payload to websocket when save is pressed', async () => {
      const realm = await loader.getHarness(TnInputHarness.with({ name: 'realm' }));
      await realm.setValue('updated');
      const primaryKdc = await loader.getHarness(TnInputHarness.with({ name: 'primary_kdc' }));
      await primaryKdc.setValue('primary_kdc3');

      const kdc = await loader.getHarness(TnChipInputHarness.with({ testId: 'chip-input-kdc' }));
      await kdc.removeChip('center1');
      await kdc.removeChip('center2');
      await kdc.addChip('center3');
      await kdc.addChip('center4');

      const adminServers = await loader.getHarness(TnChipInputHarness.with({ testId: 'chip-input-admin-server' }));
      await adminServers.removeChip('10.1.12.1');
      await adminServers.removeChip('10.1.12.2');
      await adminServers.addChip('10.10.12.1');

      const passwordServers = await loader.getHarness(TnChipInputHarness.with({ testId: 'chip-input-kpasswd-server' }));
      await passwordServers.removeChip('10.2.30.1');
      await passwordServers.removeChip('10.2.30.2');
      await passwordServers.addChip('10.120.30.1');

      spectator.component.submit();

      expect(api.call).toHaveBeenCalledWith('kerberos.realm.update', [
        13,
        {
          realm: 'updated',
          admin_server: ['10.10.12.1'],
          kdc: ['center3', 'center4'],
          kpasswd_server: ['10.120.30.1'],
          primary_kdc: 'primary_kdc3',
        },
      ]);
    });
  });
});
