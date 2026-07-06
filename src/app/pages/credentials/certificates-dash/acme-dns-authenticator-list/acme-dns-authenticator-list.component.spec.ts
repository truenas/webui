import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnIconButtonHarness, TnTableHarness } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { DnsAuthenticatorType } from 'app/enums/dns-authenticator-type.enum';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { DnsAuthenticator } from 'app/interfaces/dns-authenticator.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AcmeDnsAuthenticatorListComponent } from 'app/pages/credentials/certificates-dash/acme-dns-authenticator-list/acme-dns-authenticator-list.component';
import { AcmednsFormComponent } from 'app/pages/credentials/certificates-dash/acmedns-form/acmedns-form.component';

const authenticators = Array.from({ length: 10 }).map((_, index) => ({
  id: index + 1,
  name: `dns-authenticator-${index}`,
  attributes: {
    authenticator: DnsAuthenticatorType.Cloudflare,
  },
})) as DnsAuthenticator[];

describe('AcmeDnsAuthenticatorListComponent', () => {
  let spectator: Spectator<AcmeDnsAuthenticatorListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;
  let formPanel: FormSidePanelService;

  const createComponent = createComponentFactory({
    component: AcmeDnsAuthenticatorListComponent,
    providers: [
      mockApi([
        mockCall('acme.dns.authenticator.query', authenticators),
        mockCall('acme.dns.authenticator.delete', true),
      ]),
      mockProvider(DialogService, {
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => ({ onSuccess: jest.fn() })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    formPanel = spectator.inject(FormSidePanelService);
    table = await loader.getHarness(TnTableHarness);
  });

  it('checks page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('ACME DNS-Authenticators');
  });

  it('makes Name sortable, leaving the nested Authenticator column unsortable', async () => {
    expect(await table.isSortable('name')).toBe(true);
    expect(await table.isSortable('authenticator')).toBe(false);
    await table.clickSortHeader('name');
    expect(await table.getSortDirection('name')).toBe('ascending');
  });

  it('opens acme dns authenticator form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(formPanel.open).toHaveBeenCalledWith(AcmednsFormComponent, {
      title: 'Add DNS Authenticator',
    });
  });

  it('opens acme dns authenticator form when "Edit" button is pressed', async () => {
    const editButtons = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'mdi-pencil' }));
    await editButtons[0].click();

    expect(formPanel.open).toHaveBeenCalledWith(AcmednsFormComponent, {
      title: 'Edit DNS Authenticator',
      inputs: { editingAuthenticator: authenticators[0] },
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButtons = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: 'mdi-delete' }));
    await deleteButtons[0].click();

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Delete DNS Authenticator',
      message: 'Are you sure you want to delete the <b>dns-authenticator-0</b> DNS Authenticator?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('acme.dns.authenticator.delete', [1]);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Name', 'Authenticator', '']);
    expect(await table.getAllRowTexts()).toEqual(
      authenticators.slice(0, 4).map((authenticator) => [authenticator.name, 'cloudflare', '']),
    );
  });
});
