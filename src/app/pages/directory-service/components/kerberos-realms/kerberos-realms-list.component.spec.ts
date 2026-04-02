import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnIconHarness } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { KerberosRealm } from 'app/interfaces/kerberos-realm.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { KerberosRealmsListComponent } from 'app/pages/directory-service/components/kerberos-realms/kerberos-realms-list.component';
import { KerberosRealmsFormComponent } from 'app/pages/directory-service/components/kerberos-realms-form/kerberos-realms-form.component';

describe('KerberosRealmsListComponent', () => {
  let spectator: Spectator<KerberosRealmsListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

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
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const cells = await table.getCellTexts();
    const expectedRows = [
      ['Realm', 'KDC', 'Admin Server', 'Password Server', ''],
      ['EXAMPLE.COM', 'kdc1.example.com, kdc2.example.com', 'admin.example.com', 'passwd.example.com', ''],
    ];
    expect(cells).toEqual(expectedRows);
  });

  it('opens form to create new Kerberos Realm when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(KerberosRealmsFormComponent);
  });

  it('opens form to edit a Kerberos Realm when Edit button is pressed', async () => {
    const editIcon = await table.getHarnessInRow(TnIconHarness.with({ name: 'mdi-pencil' }), 'EXAMPLE.COM');
    await editIcon.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(KerberosRealmsFormComponent, {
      data: expect.objectContaining({ id: 1, realm: 'EXAMPLE.COM' }),
    });
  });

  it('deletes a Kerberos Realm with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInRow(TnIconHarness.with({ name: 'mdi-delete' }), 'EXAMPLE.COM');
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Kerberos Realm',
      message: 'Are you sure you want to delete this item?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('kerberos.realm.delete', [1]);
  });
});
