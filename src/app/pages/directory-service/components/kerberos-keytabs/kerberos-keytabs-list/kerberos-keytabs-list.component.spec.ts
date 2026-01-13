import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DirectoryServiceStatus, DirectoryServiceType } from 'app/enums/directory-services.enum';
import { DirectoryServicesStatus } from 'app/interfaces/directoryservices-status.interface';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  KerberosKeytabsFormComponent,
} from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form/kerberos-keytabs-form.component';
import {
  KerberosKeytabsListComponent,
} from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-list/kerberos-keytabs-list.component';

describe('KerberosKeytabsListComponent', () => {
  let spectator: Spectator<KerberosKeytabsListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;
  const createComponent = createComponentFactory({
    component: KerberosKeytabsListComponent,
    declarations: [
      MockComponent(KerberosKeytabsFormComponent),
    ],
    providers: [
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
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
        mockJob('directoryservices.sync_keytab'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
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
    table = await loader.getHarness(IxTableHarness);
  });

  it('loads and shows a list of kerberos keytabs', async () => {
    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('kerberos.keytab.query');

    const cells = await table.getCellTexts();
    expect(cells).toEqual([
      ['Name', ''],
      ['keytab1', ''],
      ['keytab2', ''],
    ]);
  });

  it('opens KerberosKeytabsFormComponent when Add is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(KerberosKeytabsFormComponent);
  });

  it('calls directoryservices.sync_keytab when Sync is pressed', async () => {
    const syncButton = await loader.getHarness(MatButtonHarness.with({ text: 'Sync' }));
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
        open: jest.fn(() => of()),
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
    const syncButtons = await loader.getAllHarnesses(MatButtonHarness.with({ text: 'Sync' }));
    expect(syncButtons).toHaveLength(0);
  });
});
