import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { KerberosKeytab } from 'app/interfaces/kerberos-config.interface';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  KerberosKeytabsFormComponent,
} from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-form/kerberos-keytabs-form.component';
import {
  KerberosKeytabsListComponent,
} from 'app/pages/directory-service/components/kerberos-keytabs/kerberos-keytabs-list/kerberos-keytabs-list.component';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

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
      mockProvider(SlideInService, {
        open: jest.fn(() => ({
          slideInClosed$: of(undefined),
        })),
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
      ]),
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

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(KerberosKeytabsFormComponent);
  });
});
