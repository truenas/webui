import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { MockApiService } from 'app/core/testing/classes/mock-api.service';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Jbof } from 'app/interfaces/jbof.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import { JbofFormComponent } from 'app/pages/system/enclosure/components/jbof-list/jbof-form/jbof-form.component';
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
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: JbofListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
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
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Description', 'IPs', 'Username', ''],
      ['description 1', '11.11.11.11, 12.12.12.12', 'admin', ''],
      ['description 2', '13.13.13.13', 'user', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('opens form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'edit' }), 'description 1');
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(JbofFormComponent, {
      data: fakeJbofDataSource[0],
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInRow(IxIconHarness.with({ name: 'mdi-delete' }), 'description 2');
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

  it('enables Add button when existing are less than licensed', () => {
    spectator.inject(MockApiService).mockCall('jbof.licensed', 3);
    spectator.component.updateAvailableJbof();
    expect(spectator.component.canAddJbof).toBeTruthy();
  });

  it('disables Add button when existing are equal to licensed', () => {
    spectator.inject(MockApiService).mockCall('jbof.licensed', 2);
    spectator.component.updateAvailableJbof();
    expect(spectator.component.canAddJbof).toBeFalsy();
  });

  it('disables Add button when existing are more than licensed', () => {
    spectator.inject(MockApiService).mockCall('jbof.licensed', 1);
    spectator.component.updateAvailableJbof();
    expect(spectator.component.canAddJbof).toBeFalsy();
  });
});
