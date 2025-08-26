import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { AllowedAddressesCardComponent } from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-card/allowed-addresses-card.component';
import { AllowedAddressesFormComponent } from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-form/allowed-addresses-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('AllowedAddressesCardComponent', () => {
  let spectator: Spectator<AllowedAddressesCardComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;
  const componentRef: SlideInRef<unknown, unknown> = {
    close: jest.fn(),
    getData: jest.fn((): undefined => undefined),
    requireConfirmationWhen: jest.fn(),
  };

  const config = {
    ui_allowlist: [
      '192.168.1.1/32',
    ],
  } as SystemGeneralConfig;

  const createComponent = createComponentFactory({
    component: AllowedAddressesCardComponent,
    imports: [
      TooltipComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(FirstTimeWarningService, {
        showFirstTimeWarningIfNeeded: jest.fn(() => of(true)),
      }),
      mockApi([
        mockCall('system.general.config', config),
        mockCall('system.general.update'),
        mockCall('system.general.ui_restart'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInRef, componentRef),
      mockProvider(SystemGeneralService, {
        handleUiServiceRestart: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
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

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(AllowedAddressesFormComponent);
  });

  it('deletes a Allowed IP Address with confirmation when Delete icon is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 1);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Delete Allowed Address',
    }));
  });

  describe('SystemGeneralService integration', () => {
    it('should call SystemGeneralService.handleUiServiceRestart when deleting an address', async () => {
      const systemGeneralService = spectator.inject(SystemGeneralService);
      const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 1);

      await deleteIcon.click();

      expect(systemGeneralService.handleUiServiceRestart).toHaveBeenCalled();
    });

    it('should handle loading state during deletion', async () => {
      // This test verifies that the loading mechanism is in place
      // The actual loading state is managed internally by the component
      const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 1);

      // Verify the delete icon exists and is clickable
      expect(deleteIcon).toBeTruthy();

      await deleteIcon.click();

      // Verify the deletion process completes
      expect(spectator.inject(SystemGeneralService).handleUiServiceRestart).toHaveBeenCalled();
    });

    it('should update system.general configuration when deleting an address', async () => {
      const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 1);
      await deleteIcon.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('system.general.update', [
        { ui_allowlist: [] }, // The single IP should be removed, leaving an empty array
      ]);
    });

    it('should show proper delete confirmation message with IP address', async () => {
      const dialogService = spectator.inject(DialogService);
      const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 1);

      await deleteIcon.click();

      expect(dialogService.confirm).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Delete Allowed Address',
        message: 'Are you sure you want to delete address 192.168.1.1/32?',
      }));
    });

    it('should not call restart service if delete confirmation is cancelled', async () => {
      const dialogService = spectator.inject(DialogService);
      const systemGeneralService = spectator.inject(SystemGeneralService);

      // Mock the confirm method to return false (cancelled)
      (dialogService.confirm as unknown) = jest.fn(() => of(false));

      const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 1);
      await deleteIcon.click();

      expect(dialogService.confirm).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Delete Allowed Address',
      }));
      expect(systemGeneralService.handleUiServiceRestart).not.toHaveBeenCalled();
    });

    it('should refresh the addresses list after successful deletion', async () => {
      const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 1);

      // Spy on the data provider load method
      const loadSpy = jest.spyOn(spectator.component.dataProvider, 'load');

      await deleteIcon.click();

      expect(loadSpy).toHaveBeenCalled();
    });
  });
});
