import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockWebsocket, mockCall } from 'app/core/testing/utils/mock-websocket.utils';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { AllowedAddressesCardComponent } from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-card/allowed-addresses-card.component';
import { AllowedAddressesFormComponent } from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-form/allowed-addresses-form.component';
import { DialogService } from 'app/services/dialog.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('AllowedAddressesCardComponent', () => {
  let spectator: Spectator<AllowedAddressesCardComponent>;
  let loader: HarnessLoader;
  let table: IxTable2Harness;

  const config = {
    ui_allowlist: [
      '192.168.1.1/32',
    ],
  } as SystemGeneralConfig;

  const createComponent = createComponentFactory({
    component: AllowedAddressesCardComponent,
    imports: [
      IxTable2Module,
    ],
    providers: [
      mockProvider(AdvancedSettingsService),
      mockWebsocket([
        mockCall('system.general.config', config),
        mockCall('system.general.update'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => {
          return { slideInClosed$: of() };
        }),
      }),
      mockProvider(IxSlideInRef),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTable2Harness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Address', ''],
      ['192.168.1.1/32', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('shows form to edit Allowed IP Addresses Configure button is pressed', async () => {
    const configureButton = await loader.getHarness(MatButtonHarness.with({ text: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(AdvancedSettingsService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(AllowedAddressesFormComponent);
  });

  it('deletes a Allowed IP Address with confirmation when Delete icon is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 1);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Delete Allowed Address',
    }));
  });
});
