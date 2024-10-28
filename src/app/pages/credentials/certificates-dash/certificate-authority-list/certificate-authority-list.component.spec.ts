import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { IxTableCellDirective } from 'app/modules/ix-table/directives/ix-table-cell.directive';
import { FormatDateTimePipe } from 'app/modules/pipes/format-date-time/format-datetime.pipe';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { CertificateAuthorityAddComponent } from 'app/pages/credentials/certificates-dash/certificate-authority-add/certificate-authority-add.component';
import { CertificateAuthorityEditComponent } from 'app/pages/credentials/certificates-dash/certificate-authority-edit/certificate-authority-edit.component';
import { CertificateAuthorityListComponent } from 'app/pages/credentials/certificates-dash/certificate-authority-list/certificate-authority-list.component';
import { SlideInService } from 'app/services/slide-in.service';
import { StorageService } from 'app/services/storage.service';

const certificates = Array.from({ length: 10 }).map((_, index) => ({
  id: index + 1,
  name: `certificate-authority-${index}`,
  issuer: 'certificate-issuer',
  from: 'Tue Jun 20 06:55:04 2023',
  until: 'Tue Jun 20 06:55:04 2024',
  signed_certificates: index,
  revoked: index % 2 === 0,
  common: 'localhost',
  san: ['DNS:localhost'],
})) as CertificateAuthority[];

describe('CertificateAuthorityListComponent', () => {
  let spectator: Spectator<CertificateAuthorityListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: CertificateAuthorityListComponent,
    imports: [
      FormatDateTimePipe,
      IxTableCellDirective,
      IxTablePagerShowMoreComponent,
    ],
    providers: [
      mockWebSocket([
        mockCall('certificateauthority.query', certificates),
        mockCall('certificateauthority.delete', true),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
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
          afterClosed: () => of(true),
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
    expect(title).toHaveText('Certificate Authorities');
  });

  it('opens certificate add form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(CertificateAuthorityAddComponent);
  });

  it('opens certificate edit form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 3);
    await editButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(CertificateAuthorityEditComponent, {
      data: certificates[0],
      wide: true,
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const dialog = spectator.inject(DialogService);
    jest.spyOn(dialog, 'confirm');
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 3);
    await deleteButton.click();

    expect(dialog.confirm).toHaveBeenCalledWith({
      buttonText: 'Delete',
      message: 'Are you sure you want to delete the <b>certificate-authority-0</b> certificate authority?',
      title: 'Delete Certificate Authority',
    });

    const deleteButton2 = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 2, 3);
    await deleteButton2.click();
    expect(dialog.confirm).toHaveBeenCalledWith({
      buttonText: 'Close',
      hideCancel: true,
      hideCheckbox: true,
      message: 'This Certificate Authority is being used to sign one or more certificates. It can be deleted  only after deleting these certificates.',
      title: 'Error',
    });
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Date', 'CN', ''],
      ['Name:certificate-authority-0Issuer:certificate-issuer', 'From:2023-06-20 06:55:04Until:2024-06-20 06:55:04', 'CN:localhostSAN:DNS:localhost', ''],
      ['Name:certificate-authority-1Issuer:certificate-issuer', 'From:2023-06-20 06:55:04Until:2024-06-20 06:55:04', 'CN:localhostSAN:DNS:localhost', ''],
      ['Name:certificate-authority-2Issuer:certificate-issuer', 'From:2023-06-20 06:55:04Until:2024-06-20 06:55:04', 'CN:localhostSAN:DNS:localhost', ''],
      ['Name:certificate-authority-3Issuer:certificate-issuer', 'From:2023-06-20 06:55:04Until:2024-06-20 06:55:04', 'CN:localhostSAN:DNS:localhost', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
