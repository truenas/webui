import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall, mockJob } from 'app/core/testing/utils/mock-websocket.utils';
import { Certificate } from 'app/interfaces/certificate.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { CertificateEditComponent } from 'app/pages/credentials/certificates-dash/certificate-edit/certificate-edit.component';
import { CertificateAddComponent } from 'app/pages/credentials/certificates-dash/forms/certificate-add/certificate-add.component';
import { SlideInService } from 'app/services/slide-in.service';
import { StorageService } from 'app/services/storage.service';
import { WebSocketService } from 'app/services/ws.service';
import { CertificateListComponent } from './certificate-list.component';

const certificates = Array.from({ length: 10 }).map((_, index) => ({
  id: index + 1,
  type: 8,
  name: `cert_default_${index}`,
  certificate: '-----BEGIN CERTIFICATE-----\nMIIDrTCCApWgAwIBAgIENFgbaDANBgkqhkiG9w0BAQsFADCBgDELMAkGA1UEBhMC\n-----END CERTIFICATE-----\n',
  privatekey: '-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCWjoaj0WEOn1yQ\n-----END PRIVATE KEY-----\n',
  CSR: null,
  revoked_date: null,
  cert_type: 'CERTIFICATE',
  revoked: false,
  can_be_revoked: true,
  issuer: 'external',
  key_length: 2048,
  key_type: 'RSA',
  common: 'localhost',
  san: [
    'DNS:localhost',
  ],
  digest_algorithm: 'SHA256',
  lifetime: 397,
  from: 'Tue Jun 20 06:55:04 2023',
  until: 'Sun Jun 20 06:55:04 2024',
  serial: 878189416,
  chain: false,
  parsed: true,
})) as Certificate[];

describe('CertificateListComponent', () => {
  let spectator: Spectator<CertificateListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: CertificateListComponent,
    imports: [
      FormatDateTimePipe,
      IxTableCellDirective,
      IxTablePagerShowMoreComponent,
    ],
    providers: [
      mockWebSocket([
        mockCall('certificate.query', certificates),
        mockJob('certificate.delete', fakeSuccessfulJob(true)),
        mockJob('certificate.update', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => {
          return of({ confirmed: true, secondaryCheckbox: true });
        }),
        jobDialog: jest.fn(() => ({
          afterClosed: jest.fn(() => of(undefined)),
        })),
      }),
      mockProvider(SlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
        onClose$: of(),
      }),
      mockProvider(SlideInRef, {
        slideInClosed$: of(true),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: jest.fn(() => of(undefined)),
        })),
      }),
      mockProvider(StorageService),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('checks page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Certificates');
  });

  it('opens certificate add form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(CertificateAddComponent);
  });

  it('opens certificate edit form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 3);
    await editButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(CertificateEditComponent, {
      data: certificates[0],
      wide: true,
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    jest.spyOn(spectator.inject(MatDialog), 'open').mockReturnValue({
      afterClosed: () => of({ force: true }),
    } as MatDialogRef<unknown>);

    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 3);
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Delete Certificate',
      message: `Are you sure you want to delete "${certificates[0].name}"?`,
      hideCheckbox: true,
      secondaryCheckbox: true,
      secondaryCheckboxText: 'Force',
      buttonColor: 'red',
      buttonText: 'Delete',
    });
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('certificate.delete', [certificates[0].id, true]);
  });

  it('revokes a certificate when Revoke button is pressed', async () => {
    jest.spyOn(spectator.inject(MatDialog), 'open').mockReturnValue({
      afterClosed: () => of({ force: true }),
    } as MatDialogRef<unknown>);

    const revokeButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-undo' }), 1, 3);
    await revokeButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('certificate.update', [certificates[0].id, { revoked: true }]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Date', 'CN', ''],
      ['Name:cert_default_0Issuer:external', 'From:2023-06-20 06:55:04Until:2024-06-20 06:55:04', 'CN:localhostSAN:DNS:localhost', ''],
      ['Name:cert_default_1Issuer:external', 'From:2023-06-20 06:55:04Until:2024-06-20 06:55:04', 'CN:localhostSAN:DNS:localhost', ''],
      ['Name:cert_default_2Issuer:external', 'From:2023-06-20 06:55:04Until:2024-06-20 06:55:04', 'CN:localhostSAN:DNS:localhost', ''],
      ['Name:cert_default_3Issuer:external', 'From:2023-06-20 06:55:04Until:2024-06-20 06:55:04', 'CN:localhostSAN:DNS:localhost', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
