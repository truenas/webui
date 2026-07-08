import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { TnButtonHarness, TnIconButtonHarness, TnTableHarness } from '@truenas/ui-components';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { AlertService } from 'app/interfaces/alert-service.interface';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { AlertServiceComponent } from 'app/pages/system/alert-service/alert-service/alert-service.component';
import { AlertServiceListComponent } from 'app/pages/system/alert-service/alert-service-list/alert-service-list.component';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';

describe('AlertServiceListComponent', () => {
  let spectator: Spectator<AlertServiceListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const alertServices = [
    {
      id: 1,
      name: 'SNMP Trap',
      attributes: {
        type: 'SNMPTrap',
        port: 162,
      },
      enabled: true,
      level: 'WARNING',
      type__title: 'SNMP Trap',
    } as AlertService,
  ];

  const createComponent = createComponentFactory({
    component: AlertServiceListComponent,
    imports: [
      BasicSearchComponent,
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('alertservice.query', alertServices),
        mockCall('alertservice.delete'),
      ]),
      mockProvider(DialogService, {
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
      }),
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.empty()),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectPreferences,
            value: {},
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Service Name', 'Type', 'Level', 'Enabled', '']);
    expect(await table.getAllRowTexts()).toEqual([
      ['SNMP Trap', 'SNMP Trap', 'Warning', 'Yes', ''],
    ]);
  });

  it('shows form to edit an existing Alert Service when Edit button is pressed', async () => {
    const editButton = await loader.getHarness(TnIconButtonHarness.with({ name: 'mdi-pencil' }));
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(AlertServiceComponent, {
      title: 'Edit Alert Service',
      inputs: { alertServiceToEdit: alertServices[0] },
    });
  });

  it('shows form to create new Alert Service when Add button is pressed', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(AlertServiceComponent, {
      title: 'Add Alert Service',
    });
  });

  it('deletes Alert Service with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await loader.getHarness(TnIconButtonHarness.with({ name: 'mdi-delete' }));
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Alert Service <b>"SNMP Trap"</b>?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('alertservice.delete', [1]);
  });
});
