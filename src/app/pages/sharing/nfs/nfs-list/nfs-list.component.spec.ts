import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NfsShare } from 'app/interfaces/nfs-share.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import {
  IxTableColumnsSelectorComponent,
} from 'app/modules/ix-table/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { ApiService } from 'app/modules/websocket/api.service';
import { NfsFormComponent } from 'app/pages/sharing/nfs/nfs-form/nfs-form.component';
import { NfsListComponent } from 'app/pages/sharing/nfs/nfs-list/nfs-list.component';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

const shares: Partial<NfsShare>[] = [
  {
    id: 1,
    enabled: true,
    hosts: ['host1', 'host2'],
    networks: ['network1', 'network2'],
    comment: 'comment',
    path: 'some-path',
  },
];

const slideInRef: SlideInRef<NfsShare | undefined, unknown> = {
  close: jest.fn(),
  requireConfirmationWhen: jest.fn(),
  getData: jest.fn(() => undefined),
};

describe('NfsListComponent', () => {
  let spectator: Spectator<NfsListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const createComponent = createComponentFactory({
    component: NfsListComponent,
    imports: [
      SearchInput1Component,
      IxTableColumnsSelectorComponent,
      FakeProgressBarComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(EmptyService),
      mockApi([
        mockCall('sharing.nfs.query', shares as NfsShare[]),
        mockCall('sharing.nfs.delete'),
        mockCall('sharing.nfs.update'),
      ]),
      mockProvider(SlideInRef, slideInRef),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideIn, {
        open: jest.fn(() => of()),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectIsEnterprise,
            value: true,
          },
        ],
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(IxTableHarness);
  });

  it('shows acurate page title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('NFS');
  });

  it('opens exporter form when "Add" button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(NfsFormComponent);
  });

  it('opens nfs share form when "Edit" button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 6);
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(NfsFormComponent, {
      data: { existingNfsShare: shares[0] },
    });
  });

  it('opens delete dialog when "Delete" button is pressed', async () => {
    const deleteButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 6);
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('sharing.nfs.delete', [1]);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Path', 'Description', 'Networks', 'Hosts', 'Enabled', 'Expose Snapshots', ''],
      ['some-path', 'comment', 'network1, network2', 'host1, host2', '', 'No', ''],
    ];

    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });
});
