import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockWebSocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { DnsAuthenticator } from 'app/interfaces/dns-authenticator.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTablePagerShowMoreComponent,
} from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { AcmeDnsAuthenticatorListComponent } from 'app/pages/credentials/certificates-dash/acme-dns-authenticator-list/acme-dns-authenticator-list.component';
import { AcmednsFormComponent } from 'app/pages/credentials/certificates-dash/forms/acmedns-form/acmedns-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

const authenticators = Array.from({ length: 10 }).map((_, index) => ({
  id: index + 1,
  name: `dns-authenticator-${index}`,
  authenticator: `tn-${index}`,
})) as unknown as DnsAuthenticator[];

describe('AcmeDnsAuthenticatorListComponent', () => {
  let spectator: Spectator<AcmeDnsAuthenticatorListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: AcmeDnsAuthenticatorListComponent,
    imports: [
      IxTablePagerShowMoreComponent,
    ],
    providers: [
      mockWebSocket([
        mockCall('acme.dns.authenticator.query', authenticators),
        mockCall('acme.dns.authenticator.delete', true),
      ]),
      mockProvider(DialogService, {
        confirm: () => of(true),
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
    expect(title).toHaveText('ACME DNS-Authenticators');
  });

  it('opens acme dns authenticator form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(AcmednsFormComponent);
  });

  it('opens acme dns authenticator form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 2);
    await editButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(AcmednsFormComponent, {
      data: authenticators[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 2);
    await deleteButton.click();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('acme.dns.authenticator.delete', [1]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Authenticator', ''],
      ['dns-authenticator-0', 'tn-0', ''],
      ['dns-authenticator-1', 'tn-1', ''],
      ['dns-authenticator-2', 'tn-2', ''],
      ['dns-authenticator-3', 'tn-3', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
