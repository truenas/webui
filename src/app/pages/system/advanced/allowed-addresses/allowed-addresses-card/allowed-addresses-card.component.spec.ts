import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnIconHarness, TnTableHarness } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { AllowedAddressesCardComponent } from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-card/allowed-addresses-card.component';
import { AllowedAddressesFormComponent } from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-form/allowed-addresses-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { SystemGeneralService } from 'app/services/system-general.service';

describe('AllowedAddressesCardComponent', () => {
  let spectator: Spectator<AllowedAddressesCardComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;
  let formPanel: FormSidePanelService;

  const config = {
    ui_allowlist: [
      '192.168.1.1/32',
    ],
  } as SystemGeneralConfig;

  const createComponent = createComponentFactory({
    component: AllowedAddressesCardComponent,
    providers: [
      mockAuth(),
      provideMockStore(),
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
      mockProvider(SnackbarService),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.cancel()),
      }),
      mockProvider(SystemGeneralService, {
        handleUiServiceRestart: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
    formPanel = spectator.inject(FormSidePanelService);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Address', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['192.168.1.1/32', ''],
    ]);
  });

  it('opens the side panel form when Configure button is pressed', async () => {
    const configureButton = await loader.getHarness(TnButtonHarness.with({ label: 'Configure' }));
    await configureButton.click();

    expect(spectator.inject(FirstTimeWarningService).showFirstTimeWarningIfNeeded).toHaveBeenCalled();
    expect(formPanel.open).toHaveBeenCalledWith(AllowedAddressesFormComponent, {
      title: 'Allowed IP Addresses',
    });
  });

  it('deletes a Allowed IP Address with confirmation when Delete icon is pressed', async () => {
    const deleteIcon = await loader.getHarness(TnIconHarness.with({ name: 'mdi-delete' }));
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Delete Allowed Address',
    }));
  });

  describe('SystemGeneralService integration', () => {
    it('should call SystemGeneralService.handleUiServiceRestart when deleting an address', async () => {
      const systemGeneralService = spectator.inject(SystemGeneralService);
      const deleteIcon = await loader.getHarness(TnIconHarness.with({ name: 'mdi-delete' }));

      await deleteIcon.click();

      expect(systemGeneralService.handleUiServiceRestart).toHaveBeenCalled();
    });

    it('should update system.general configuration when deleting an address', async () => {
      const deleteIcon = await loader.getHarness(TnIconHarness.with({ name: 'mdi-delete' }));
      await deleteIcon.click();

      expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('system.general.update', [
        { ui_allowlist: [] }, // The single IP should be removed, leaving an empty array
      ]);
    });

    it('should show proper delete confirmation message with IP address', async () => {
      const dialogService = spectator.inject(DialogService);
      const deleteIcon = await loader.getHarness(TnIconHarness.with({ name: 'mdi-delete' }));

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

      const deleteIcon = await loader.getHarness(TnIconHarness.with({ name: 'mdi-delete' }));
      await deleteIcon.click();

      expect(dialogService.confirm).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Delete Allowed Address',
      }));
      expect(systemGeneralService.handleUiServiceRestart).not.toHaveBeenCalled();
    });

    it('should refresh the addresses list after successful deletion', async () => {
      const deleteIcon = await loader.getHarness(TnIconHarness.with({ name: 'mdi-delete' }));

      // Spy on the data provider load method
      const loadSpy = jest.spyOn(spectator.component.dataProvider, 'load');

      await deleteIcon.click();

      expect(loadSpy).toHaveBeenCalled();
    });
  });
});
