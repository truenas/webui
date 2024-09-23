import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog } from '@angular/material/dialog';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { IscsiExtent } from 'app/interfaces/iscsi.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { IxSlideInRef } from 'app/modules/forms/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { ExtentFormComponent } from 'app/pages/sharing/iscsi/extent/extent-form/extent-form.component';
import { DeleteExtentDialogComponent } from 'app/pages/sharing/iscsi/extent/extent-list/delete-extent-dialog/delete-extent-dialog.component';
import { ExtentListComponent } from 'app/pages/sharing/iscsi/extent/extent-list/extent-list.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

const extents: IscsiExtent[] = [
  {
    id: 1,
    name: 'test-iscsi-extent',
    path: '/dev/zvol/tank/iscsi-extent',
    comment: 'test-iscsi-extent-comment',
    serial: 'test-iscsi-extent-serial',
    enabled: true,
    naa: '0x6589cfc00000097bd2aa6aff515d84c9',
  } as IscsiExtent,
];

describe('ExtentListComponent', () => {
  let spectator: Spectator<ExtentListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: ExtentListComponent,
    imports: [
      AppLoaderModule,
      SearchInput1Component,
      IxTableColumnsSelectorComponent,
    ],
    providers: [
      mockProvider(EmptyService),
      mockWebSocket([
        mockCall('iscsi.extent.query', extents),
        mockCall('iscsi.extent.delete'),
      ]),
      mockProvider(IxSlideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(IxSlideInService, {
        open: jest.fn(() => ({ slideInClosed$: of(true) })),
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: jest.fn(() => of(null)),
        })),
      }),
      mockAuth(),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows acurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('Extents');
  });

  it('opens extent form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(ExtentFormComponent, { wide: true });
  });

  it('opens extent form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 6);
    await editButton.click();

    expect(spectator.inject(IxSlideInService).open).toHaveBeenCalledWith(ExtentFormComponent, {
      data: extents[0],
      wide: true,
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'delete' }), 1, 6);
    await deleteButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(DeleteExtentDialogComponent, {
      data: extents[0],
    });
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Extent Name', 'Device/File', 'Description', 'Serial', 'NAA', 'Enabled', ''],
      [
        'test-iscsi-extent',
        '/dev/zvol/tank/iscsi-extent',
        'test-iscsi-extent-comment',
        'test-iscsi-extent-serial',
        '0x6589cfc00000097bd2aa6aff515d84c9',
        'Yes',
        '',
      ],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
