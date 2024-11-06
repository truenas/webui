import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponent, MockComponents, MockDirective } from 'ng-mocks';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { DetailsHeightDirective } from 'app/directives/details-height/details-height.directive';
import { JobState } from 'app/enums/job-state.enum';
import { CloudBackup } from 'app/interfaces/cloud-backup.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableHarness } from 'app/modules/ix-table/components/ix-table/ix-table.harness';
import { SortDirection } from 'app/modules/ix-table/enums/sort-direction.enum';
import { selectJobs } from 'app/modules/jobs/store/job.selectors';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { CloudBackupDetailsComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-details/cloud-backup-details.component';
import {
  CloudBackupFormComponent,
} from 'app/pages/data-protection/cloud-backup/cloud-backup-form/cloud-backup-form.component';
import { CloudBackupListComponent } from 'app/pages/data-protection/cloud-backup/cloud-backup-list/cloud-backup-list.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';
import { selectPreferences } from 'app/store/preferences/preferences.selectors';
import { selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('CloudBackupListComponent', () => {
  let spectator: Spectator<CloudBackupListComponent>;
  let loader: HarnessLoader;
  let table: IxTableHarness;

  const cloudBackups = [
    {
      id: 1,
      description: 'UA',
      path: '/mnt/nmnmn',
      pre_script: 'your_pre_script',
      snapshot: false,
      enabled: false,
      job: {
        state: JobState.Finished,
        time_finished: {
          $date: new Date().getTime() - 50000,
        },
      },
    } as CloudBackup,
  ];

  const createComponent = createComponentFactory({
    component: CloudBackupListComponent,
    imports: [
      MockComponent(PageHeaderComponent),
      SearchInput1Component,
      MockComponents(
        CloudBackupListComponent,
        CloudBackupDetailsComponent,
      ),
      MockDirective(DetailsHeightDirective),
    ],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('cloud_backup.query', cloudBackups),
        mockCall('cloud_backup.delete'),
        mockCall('cloud_backup.update'),
        mockJob('cloud_backup.sync'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
      mockProvider(SlideInRef),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of({
          response: true,
        })),
      }),
      provideMockStore({
        selectors: [
          {
            selector: selectSystemConfigState,
            value: {},
          },
          {
            selector: selectPreferences,
            value: {},
          },
          {
            selector: selectJobs,
            value: [{
              state: JobState.Finished,
              time_finished: {
                $date: new Date().getTime() - 50000,
              },
            }],
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

  it('shows form to edit an existing Cloud Backup when Edit button is pressed', async () => {
    const editButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'edit' }), 1, 5);
    await editButton.click();

    expect(spectator.inject(ChainedSlideInService).open).toHaveBeenCalledWith(
      CloudBackupFormComponent,
      true,
      cloudBackups[0],
    );
  });

  it('shows form to create new Cloud Backup when Add button is pressed', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();

    expect(spectator.inject(ChainedSlideInService).open).toHaveBeenCalledWith(
      CloudBackupFormComponent,
      true,
      undefined,
    );
  });

  it('shows confirmation dialog when Run Now button is pressed', async () => {
    const runNowButton = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-play-circle' }), 1, 5);
    await runNowButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Run Now',
      message: 'Run «UA» Cloud Backup now?',
      hideCheckbox: true,
    });

    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('cloud_backup.sync', [1]);
    expect(spectator.component.dataProvider.expandedRow).toEqual({ ...cloudBackups[0] });
  });

  it('deletes a Cloud Backup with confirmation when Delete button is pressed', async () => {
    const deleteIcon = await table.getHarnessInCell(IxIconHarness.with({ name: 'mdi-delete' }), 1, 5);
    await deleteIcon.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Confirmation',
      message: 'Delete Cloud Backup <b>"UA"</b>?',
    });

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith('cloud_backup.delete', [1]);
  });

  it('updates Cloud Backup Enabled status once mat-toggle is updated', async () => {
    const toggle = await table.getHarnessInCell(MatSlideToggleHarness, 1, 1);

    expect(await toggle.isChecked()).toBe(false);

    await toggle.check();

    expect(spectator.inject(WebSocketService).call).toHaveBeenCalledWith(
      'cloud_backup.update',
      [1, { enabled: true }],
    );
  });

  it('closes mobile details view and updates dataProvider expandedRow', () => {
    spectator.component.showMobileDetails = true;
    spectator.component.dataProvider.expandedRow = cloudBackups[0];

    spectator.component.closeMobileDetails();

    expect(spectator.component.showMobileDetails).toBe(false);
    expect(spectator.component.dataProvider.expandedRow).toBeNull();
  });

  it('sets the default sort for dataProvider', () => {
    spectator.component.dataProvider = {
      setSorting: jest.fn(),
    } as unknown as AsyncDataProvider<CloudBackup>;

    spectator.component.setDefaultSort();

    expect(spectator.component.dataProvider.setSorting).toHaveBeenCalledWith({
      active: 1,
      direction: SortDirection.Asc,
      propertyName: 'description',
    });
  });

  it('filters the list of cloud backups based on the query string', () => {
    spectator.component.dataProvider = {
      setFilter: jest.fn(),
    } as unknown as AsyncDataProvider<CloudBackup>;

    const queryString = 'UA';
    spectator.component.onListFiltered(queryString);

    expect(spectator.component.filterString).toBe(queryString.toLowerCase());

    expect(spectator.component.dataProvider.setFilter).toHaveBeenCalledWith({
      query: queryString,
      columnKeys: ['description'],
    });
  });
});
