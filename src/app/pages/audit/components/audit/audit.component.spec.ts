import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { AuditEntry } from 'app/interfaces/audit.interface';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AuditComponent } from 'app/pages/audit/components/audit/audit.component';
import { selectAdvancedConfig, selectGeneralConfig, selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('AuditComponent', () => {
  let spectator: Spectator<AuditComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const auditLogs = [
    {
      audit_id: '0aa63181-e8ae-44e1-a1e6-8be1d9469206',
      message_timestamp: 1699440714,
      timestamp: {
        $date: 1699440714000,
      },
      address: '127.0.0.1',
      username: 'bob',
      session: '390666ac-0cb3-4135-a99b-f2792f5cd264',
      service: 'SMB',
      service_data: {
        vers: {
          major: 0,
          minor: 1,
        },
        service: 'share',
        session_id: '1741083551',
        tcon_id: '3628929809',
      },
      event: 'CREATE',
      event_data: {
        file_type: 'FILE',
        file: {
          path: 'renamed_file',
          handle: {
            type: 'DEV_INO',
            value: '5243027:2:0',
          },
        },
      },
      success: true,
    },
  ] as unknown as AuditEntry[];

  const createComponent = createComponentFactory({
    component: AuditComponent,
    imports: [
      IxTable2Module,
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectSystemConfigState,
            value: {},
          },
          {
            selector: selectGeneralConfig,
            value: {},
          },
          {
            selector: selectAdvancedConfig,
            value: {},
          },
        ],
      }),
      mockWebsocket([
        mockCall('audit.query', auditLogs),
      ]),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Provider', ''],
      ['GDrive', 'Google Drive', ''],
      ['BB2', 'Backblaze B2', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
