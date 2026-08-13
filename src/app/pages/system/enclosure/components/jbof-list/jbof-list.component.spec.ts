import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnIconButtonHarness, TnTableHarness } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Jbof } from 'app/interfaces/jbof.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { ApiService } from 'app/modules/websocket/api.service';
import { JbofListComponent } from 'app/pages/system/enclosure/components/jbof-list/jbof-list.component';

const fakeJbofDataSource: Jbof[] = [
  {
    id: 1,
    description: 'description 1',
    mgmt_ip1: '11.11.11.11',
    mgmt_ip2: '12.12.12.12',
    mgmt_username: 'admin',
    mgmt_password: 'qwerty',
  },
  {
    id: 2,
    description: 'description 2',
    mgmt_ip1: '13.13.13.13',
    mgmt_ip2: '',
    mgmt_username: 'user',
    mgmt_password: '12345678',
  },
];

describe('JbofListComponent', () => {
  let spectator: Spectator<JbofListComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: JbofListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      BasicSearchComponent,
    ],
    providers: [
      mockApi([
        mockCall('jbof.query', fakeJbofDataSource),
        mockCall('jbof.delete', true),
        mockCall('jbof.licensed', 1),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of({ confirmed: true, secondaryCheckbox: false })),
      }),
      mockProvider(FormSidePanelService, {
        openForm: jest.fn(() => SlideInResult.empty()),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('should show table rows', async () => {
    expect(await table.getHeaderTexts()).toEqual(['Description', 'IPs', 'Username', '']);
    expect(await table.getRowTexts(0)).toEqual(['description 1', '11.11.11.11, 12.12.12.12', 'admin', '']);
    expect(await table.getRowTexts(1)).toEqual(['description 2', '13.13.13.13', 'user', '']);
  });

  it('opens form when "Edit" button is pressed', async () => {
    const editButton = await loader.getHarness(
      TnIconButtonHarness.with({ ancestor: '[data-row-index="0"]', name: 'mdi-pencil' }),
    );
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).openForm).toHaveBeenCalledWith(expect.anything(), {
      title: 'Edit Expansion Shelf',
      editData: fakeJbofDataSource[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await loader.getHarness(
      TnIconButtonHarness.with({ ancestor: '[data-row-index="1"]', name: 'mdi-delete' }),
    );
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Delete',
      message: 'Are you sure you want to delete this item?',
      hideCheckbox: true,
      secondaryCheckbox: true,
      secondaryCheckboxText: 'Force',
      buttonText: 'Delete',
      buttonColor: 'warn',
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('jbof.delete', [2, false]);
  });

  it('enables Add button when existing are less than licensed', async () => {
    spectator.inject(MockApiService).mockCall('jbof.licensed', 3);
    spectator.component.updateAvailableJbof();

    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    expect(await addButton.isDisabled()).toBe(false);
  });

  it('disables Add button when existing are equal to licensed', async () => {
    spectator.inject(MockApiService).mockCall('jbof.licensed', 2);
    spectator.component.updateAvailableJbof();

    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    expect(await addButton.isDisabled()).toBe(true);
  });

  it('disables Add button when existing are more than licensed', async () => {
    spectator.inject(MockApiService).mockCall('jbof.licensed', 1);
    spectator.component.updateAvailableJbof();

    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    expect(await addButton.isDisabled()).toBe(true);
  });
});
