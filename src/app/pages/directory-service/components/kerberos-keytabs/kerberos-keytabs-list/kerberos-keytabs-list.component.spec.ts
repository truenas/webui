import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonComponent, TnButtonHarness, TnTableHarness } from '@truenas/ui-components';
import { MockComponent, ngMocks } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DirectoryServiceStatus, DirectoryServiceType } from 'app/enums/directory-services.enum';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  KerberosKeytabsFormComponent,
} from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form/kerberos-keytabs-form.component';
import {
  KerberosKeytabsListComponent,
} from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-list/kerberos-keytabs-list.component';

// Mocking KerberosKeytabsFormComponent would otherwise mock its transitive tn-component
// imports, which trips the ng-mocks signal-query bug
// (https://github.com/help-me-mom/ng-mocks/issues/8634). Keep the tn-button real.
ngMocks.globalKeep(TnButtonComponent, true);

describe('KerberosKeytabsListComponent', () => {
  let spectator: Spectator<KerberosKeytabsListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;
  const createComponent = createComponentFactory({
    component: KerberosKeytabsListComponent,
    declarations: [
      MockComponent(KerberosKeytabsFormComponent),
    ],
    providers: [
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockApi([
        mockCall('kerberos.keytab.query', [
          {
            id: 1,
            name: 'keytab1',
          },
          {
            id: 2,
            name: 'keytab2',
          },
        ] as KerberosKeytab[]),
        mockCall('directoryservices.status', {
          type: DirectoryServiceType.ActiveDirectory,
          status: DirectoryServiceStatus.Healthy,
        } as DirectoryServicesStatus),
        mockCall('kerberos.keytab.delete'),
        mockJob('directoryservices.sync_keytab'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('loads and shows a list of kerberos keytabs', async () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('kerberos.keytab.query');

    expect(await table.getHeaderTexts()).toEqual(['Name', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['keytab1', ''],
      ['keytab2', ''],
    ]);
  });

  it('opens KerberosKeytabsFormComponent when Add is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(KerberosKeytabsFormComponent);
  });

  it('deletes a keytab with confirmation when Delete button is pressed', () => {
    spectator.click(spectator.query('[aria-label^="Delete"]'));

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      message: 'Are you sure you want to delete this item?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('kerberos.keytab.delete', [1]);
  });

  it('calls directoryservices.sync_keytab when Sync is pressed', async () => {
    const syncButton = await loader.getHarness(TnButtonHarness.with({ label: 'Sync' }));
    await syncButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('directoryservices.sync_keytab');
  });
});

describe('KerberosKeytabsListComponent - LDAP mode', () => {
  let spectator: Spectator<KerberosKeytabsListComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: KerberosKeytabsListComponent,
    declarations: [
      MockComponent(KerberosKeytabsFormComponent),
    ],
    providers: [
      mockProvider(SlideIn, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      mockApi([
        mockCall('kerberos.keytab.query', []),
        mockCall('directoryservices.status', {
          type: DirectoryServiceType.Ldap,
          status: DirectoryServiceStatus.Healthy,
        } as DirectoryServicesStatus),
      ]),
      mockProvider(DialogService),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('does not show Sync button when AD is disabled', async () => {
    const syncButtons = await loader.getAllHarnesses(TnButtonHarness.with({ label: 'Sync' }));
    expect(syncButtons).toHaveLength(0);
  });
});
