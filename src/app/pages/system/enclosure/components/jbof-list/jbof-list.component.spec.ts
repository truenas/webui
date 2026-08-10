import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { By } from '@angular/platform-browser';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import {
  TnButtonHarness, TnIconButtonComponent, TnIconButtonHarness, TnTableHarness,
} from '@truenas/ui-components';
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
import { TableActionsCellComponent } from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
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

  /**
   * The row action buttons render in row order, so index 0 is `description 1`.
   * `TnIconButtonHarness` has no ancestor-by-row filter, and the per-row `data-test`
   * is not a supported locator.
   */
  async function actionButton(iconName: string, rowIndex: number): Promise<TnIconButtonHarness> {
    const buttons = await loader.getAllHarnesses(TnIconButtonHarness.with({ name: iconName }));
    return buttons[rowIndex];
  }

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
    expect(await table.getAllRowTexts()).toEqual([
      ['description 1', '11.11.11.11, 12.12.12.12', 'admin', ''],
      ['description 2', '13.13.13.13', 'user', ''],
    ]);
  });

  it('names the row action buttons for screen readers', () => {
    // The legacy ix-table composed these from the column model's `ariaLabels`; the tn-table
    // actions cell has to be handed them, so lock the composed value. `TnIconButtonHarness`
    // has no ariaLabel filter, so read the public input — scoped to the action cells, since
    // the pager renders icon buttons of its own.
    const labels = spectator.fixture.debugElement
      .queryAll(By.directive(TableActionsCellComponent))
      .flatMap((cell) => cell.queryAll(By.directive(TnIconButtonComponent)))
      .map((button) => (button.componentInstance as TnIconButtonComponent).ariaLabel());

    expect(labels).toEqual([
      'Edit admin JBOF',
      'Delete admin JBOF',
      'Edit user JBOF',
      'Delete user JBOF',
    ]);
  });

  it('sorts by the derived IPs column', async () => {
    // `ips` renders a value no single property holds, so it only sorts if the component
    // hands `mapTnSortToTableSort` an explicit accessor.
    await table.clickSortHeader('ips');
    await table.clickSortHeader('ips');
    spectator.detectChanges();

    expect((await table.getAllRowTexts()).map((row) => row[1])).toEqual([
      '13.13.13.13',
      '11.11.11.11, 12.12.12.12',
    ]);
  });

  it('opens form when "Edit" button is pressed', async () => {
    const editButton = await actionButton('mdi-pencil', 0);
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).openForm).toHaveBeenCalledWith(expect.anything(), {
      title: 'Edit Expansion Shelf',
      editData: fakeJbofDataSource[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await actionButton('mdi-delete', 1);
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
