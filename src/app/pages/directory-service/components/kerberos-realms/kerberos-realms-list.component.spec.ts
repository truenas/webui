import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnTableHarness } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { KerberosRealm } from 'app/interfaces/kerberos-realm.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { KerberosRealmsListComponent } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-list.component';
import { KerberosRealmsFormComponent } from 'app/pages/directory-service/components/kerberos-realms-form/kerberos-realms-form.component';

describe('KerberosRealmsListComponent', () => {
  let spectator: Spectator<KerberosRealmsListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const kerberosRealms = [
    {
      id: 1,
      realm: 'EXAMPLE.COM',
      kdc: ['kdc1.example.com', 'kdc2.example.com'],
      admin_server: ['admin.example.com'],
      kpasswd_server: ['passwd.example.com'],
    } as KerberosRealm,
  ];

  const createComponent = createComponentFactory({
    component: KerberosRealmsListComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockCall('kerberos.realm.query', kerberosRealms),
        mockCall('kerberos.realm.delete'),
      ]),
      mockProvider(DialogService, {
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Realm', 'KDC', 'Admin Server', 'Password Server', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['EXAMPLE.COM', 'kdc1.example.com, kdc2.example.com', 'admin.example.com', 'passwd.example.com', ''],
    ]);
  });

  it('opens form to create new Kerberos Realm when Add button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(KerberosRealmsFormComponent);
  });

  it('opens form to edit a Kerberos Realm when Edit button is pressed', () => {
    // The row action buttons live in ix-table-actions-cell (NAS-141029-owned, not part
    // of this migration); TnTableHarness exposes no per-row action harness, so we query
    // by aria-label. Safe here because the table renders a single data row.
    spectator.click(spectator.query('[aria-label^="Edit"]'));

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(KerberosRealmsFormComponent, {
      data: expect.objectContaining({ id: 1, realm: 'EXAMPLE.COM' }),
    });
  });

  it('deletes a Kerberos Realm with confirmation when Delete button is pressed', () => {
    // See note above: ix-table-actions-cell row action, queried by aria-label.
    spectator.click(spectator.query('[aria-label^="Delete"]'));

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Kerberos Realm',
      message: 'Are you sure you want to delete this item?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('kerberos.realm.delete', [1]);
  });
});
