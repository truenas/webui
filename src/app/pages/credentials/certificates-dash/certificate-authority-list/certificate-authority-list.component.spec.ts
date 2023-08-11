import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { FakeFormatDateTimePipe } from 'app/core/testing/classes/fake-format-datetime.pipe';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { CertificateAuthority } from 'app/interfaces/certificate-authority.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { CertificateAuthorityAddComponent } from 'app/pages/credentials/certificates-dash/certificate-authority-add/certificate-authority-add.component';
import { CertificateAuthorityEditComponent } from 'app/pages/credentials/certificates-dash/certificate-authority-edit/certificate-authority-edit.component';
import { CertificateAuthorityListComponent } from 'app/pages/credentials/certificates-dash/certificate-authority-list/certificate-authority-list.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
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

  const createComponent = createComponentFactory({
    component: CertificateAuthorityListComponent,
    imports: [
      IxTable2Module,
    ],
    declarations: [FakeFormatDateTimePipe],
    providers: [
      mockWebsocket([
        mockCall('certificateauthority.query', certificates),
        mockCall('certificateauthority.delete', true),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of(true) };
        }),
        onClose$: of(),
      }),
      mockProvider(IxSlideInRef, {
        slideInClosed$: of(true),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(true),
        })),
      }),
      mockProvider(StorageService),
      mockProvider(ErrorHandlerService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Certificate Authorities');
  });

  it('opens certificate add form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CertificateAuthorityAddComponent);
  });

  it('opens certificate edit form when "Edit" button is pressed', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ selector: '[aria-label="Edit"]' }));
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(CertificateAuthorityEditComponent, {
      data: certificates[0],
      wide: true,
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const dialog = spectator.inject(DialogService);
    jest.spyOn(dialog, 'confirm');
    const deleteButtons = await loader.getAllHarnesses(MatButtonHarness.with({ selector: '[aria-label="Delete"]' }));
    await deleteButtons[0].click();

    expect(dialog.confirm).toHaveBeenCalledWith({
      buttonText: 'Delete',
      message: 'Are you sure you want to delete the <b>certificate-authority-0</b> certificate authority?',
      title: 'Delete Certificate Authority',
    });

    await deleteButtons[1].click();
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

    const table = await loader.getHarness(IxTable2Harness);
    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
