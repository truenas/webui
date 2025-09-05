import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialog } from '@angular/material/dialog';
import {
  createComponentFactory, mockProvider, Spectator,
} from '@ngneat/spectator/jest';
import { Store } from '@ngrx/store';
import { Observable, of, throwError } from 'rxjs';
import { JobProgressDialogRef } from 'app/classes/job-progress-dialog-ref.class';
import {
  mockCall, mockJob, mockApi,
} from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Job } from 'app/interfaces/job.interface';
import { PoolAttachment } from 'app/interfaces/pool-attachment.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { Process } from 'app/interfaces/process.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { LoaderService } from 'app/modules/loader/loader.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import {
  ServicesToBeRestartedDialogComponent,
} from 'app/pages/storage/components/dashboard-pool/export-disconnect-modal/services-need-to-be-restarted-dialog/services-to-be-restarted-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FailedJobError } from 'app/services/errors/error.classes';
import { selectIsHaEnabled } from 'app/store/ha-info/ha-info.selectors';
import { DisconnectOption, ExportDisconnectModalComponent } from './export-disconnect-modal.component';

const fakePool = {
  id: 9999,
  name: 'fakePool',
  status: PoolStatus.Healthy,
} as Pool;

const fakeSystemConfig = {
  pool: 'fakeSystemPool',
} as SystemDatasetConfig;

// Includes the current pool being exported/deleted (fakePool with id: 9999)
const fakeMultiplePools = [
  { id: 1, name: 'otherPool1' },
  { id: 2, name: 'otherPool2' },
  { id: 9999, name: 'fakePool' }, // Current pool
] as Pool[];

// Only the current pool exists (last pool scenario)
const fakeSinglePool = [
  { id: 9999, name: 'fakePool' }, // Current pool only
] as Pool[];

const fakeUnknownPool = {
  id: 8888,
  name: 'unknownPool',
  status: PoolStatus.Unknown,
} as Pool;

const fakeAttachments = [
  { type: 'SMB', attachments: ['share1,share2', 'share3'] },
  { type: 'NFS', attachments: ['export1,export2'] },
  { type: 'iSCSI', attachments: ['target1', 'target2,target3'] },
  { type: 'Apps', attachments: ['nextcloud,plex', 'jellyfin'] },
] as PoolAttachment[];

const fakeProcesses = [
  { name: 'nginx', pid: 1234, cmdline: '/usr/sbin/nginx' },
  { name: 'postgres', pid: 5678, cmdline: '/usr/bin/postgres' },
  { name: '', pid: 9999, cmdline: '/some/unknown/process' }, // Empty name makes it unknown
] as Process[];


describe('ExportDisconnectModalComponent', () => {
  let spectator: Spectator<ExportDisconnectModalComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ExportDisconnectModalComponent,
    imports: [
      ReactiveFormsModule,
    ],
    providers: [
      mockApi([
        mockCall('pool.attachments', fakeAttachments),
        mockCall('pool.processes', fakeProcesses),
        mockCall('systemdataset.config', fakeSystemConfig),
        mockCall('pool.query', fakeMultiplePools),
        mockCall('pool.dataset.query', []),
        mockJob('pool.export'),
      ]),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
        error: jest.fn(),
      }),
      mockProvider(MatDialogRef),
      mockProvider(MatDialog, {
        open: jest.fn(() => ({
          afterClosed: () => of(false),
        }) as unknown as MatDialogRef<JobProgressDialogRef<unknown>>),
      }),
      mockProvider(LoaderService, {
        withLoader: jest.fn(() => (source$: Observable<unknown>) => source$),
      }),
      mockProvider(DatasetTreeStore, {
        resetDatasets: jest.fn(),
      }),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => (source$: Observable<unknown>) => source$),
        showErrorModal: jest.fn(),
      }),
      mockAuth(),
      mockProvider(SnackbarService, {
        success: jest.fn(),
      }),
      mockProvider(Store, {
        select: jest.fn((selector) => {
          if (selector === selectIsHaEnabled) {
            return of(false); // Default to non-HA
          }
          return of(null);
        }),
      }),
    ],
    componentProviders: [
      { provide: MAT_DIALOG_DATA, useValue: fakePool },
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);

    // Wait for component initialization and data loading
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    // Wait for the selected content to be visible
    await spectator.fixture.whenStable();
    spectator.detectChanges();
  });

  afterEach(() => {
    spectator.fixture.destroy();
  });

  it('should display the pool name in the title', () => {
    expect(spectator.query('.export-disconnect-modal-title')).toContainText('Disconnect Pool: fakePool');
  });

  it('should start with Export option selected by default', () => {
    expect(spectator.component.selectedOption()).toBe(DisconnectOption.Export);
    expect(spectator.query('.export-option')).toHaveClass('selected');
  });

  describe('component getters', () => {
    it('should correctly identify export selection', () => {
      spectator.component.selectOption(DisconnectOption.Export);
      expect(spectator.component.isExportSelected).toBe(true);
      expect(spectator.component.isDeleteSelected).toBe(false);
    });

    it('should correctly identify delete selection', () => {
      spectator.component.selectOption(DisconnectOption.Delete);
      expect(spectator.component.isExportSelected).toBe(false);
      expect(spectator.component.isDeleteSelected).toBe(true);
    });

    it('should correctly identify last pool', () => {
      spectator.component.totalPoolCount = 1;
      expect(spectator.component.isLastPool).toBe(true);

      spectator.component.totalPoolCount = 3;
      expect(spectator.component.isLastPool).toBe(false);
    });

    it('should correctly determine HA warning conditions', () => {
      spectator.component.isHaEnabled = true;
      spectator.component.totalPoolCount = 1;
      spectator.component.selectOption(DisconnectOption.Export);
      expect(spectator.component.shouldShowHaWarning).toBe(true);

      spectator.component.selectOption(DisconnectOption.Delete);
      expect(spectator.component.shouldShowHaWarning).toBe(true); // Now shows for both operations

      spectator.component.selectOption(DisconnectOption.Export);
      spectator.component.totalPoolCount = 3;
      expect(spectator.component.shouldShowHaWarning).toBe(false); // Multiple pools = no warning

      spectator.component.isHaEnabled = false;
      spectator.component.totalPoolCount = 1;
      expect(spectator.component.shouldShowHaWarning).toBe(false); // HA disabled = no warning
    });
  });

  it('should allow selecting Delete option', () => {
    spectator.click('.delete-option');
    expect(spectator.component.selectedOption()).toBe(DisconnectOption.Delete);
    expect(spectator.query('.delete-option')).toHaveClass('selected');
  });

  it('should show export warning when Export is selected', () => {
    expect(spectator.query('.export-warning')).toContainText('Back up critical data before exporting');
  });

  it('should show delete warning when Delete is selected', () => {
    spectator.click('.delete-option');
    spectator.detectChanges();
    expect(spectator.query('.delete-warning')).toContainText('All data will be deleted from the pool');
  });

  describe('system dataset warnings', () => {
    beforeEach(() => {
      // Set up system dataset on the current pool and select Export option
      spectator.component.systemConfig = { pool: 'fakePool' } as SystemDatasetConfig;
      spectator.component.showSysDatasetWarning = true;
      spectator.component.selectOption(DisconnectOption.Export); // Required for shouldShowSystemDatasetWarning
      spectator.detectChanges();
    });

    it('should show system dataset warning when system dataset is on this pool', () => {
      spectator.component.totalPoolCount = 3; // Multiple pools exist
      spectator.detectChanges();

      // Verify conditions are met
      expect(spectator.component.showSysDatasetWarning).toBe(true);

      // Look for the system dataset panel specifically by its title text
      const systemDatasetPanel = spectator.queryAll('.expansion-panel')
        .find((panel) => panel.textContent.includes('System dataset will be moved off this pool'));
      expect(systemDatasetPanel).toExist();
      expect(systemDatasetPanel).toContainText('moved off this pool to ensure system functionality');
    });

    it('should show system dataset warning regardless of pool count', () => {
      // Explicitly set up conditions from scratch to avoid test pollution
      spectator.component.totalPoolCount = 1; // Only this pool exists
      spectator.component.systemConfig = { pool: 'fakePool' } as SystemDatasetConfig;
      spectator.component.showSysDatasetWarning = true;
      spectator.component.selectOption(DisconnectOption.Export);

      // Force multiple change detection cycles to ensure everything is updated
      spectator.detectChanges();
      spectator.fixture.detectChanges();
      spectator.detectChanges();

      // Verify conditions are met
      expect(spectator.component.showSysDatasetWarning).toBe(true);

      // Look for the system dataset panel specifically by its title text
      const systemDatasetPanel = spectator.queryAll('.expansion-panel')
        .find((panel) => panel.textContent.includes('System dataset will be moved off this pool'));
      expect(systemDatasetPanel).toExist();
      expect(systemDatasetPanel).toContainText('moved off this pool to ensure system functionality');
    });

    it('should show system dataset warning for delete operation as well', () => {
      spectator.component.totalPoolCount = 2;
      spectator.component.selectOption(DisconnectOption.Delete); // Select delete instead of export
      spectator.detectChanges();

      // Verify the system dataset panel shows for delete operations too
      const systemDatasetPanel = spectator.queryAll('.expansion-panel')
        .find((panel) => panel.textContent.includes('System dataset will be moved off this pool'));
      expect(systemDatasetPanel).toExist();
      expect(systemDatasetPanel).toContainText('moved off this pool to ensure system functionality');
    });
  });

  describe('HA functionality', () => {
    it('should load HA status from store during initialization', () => {
      const mockStore$ = spectator.inject(Store);
      expect(mockStore$.select).toHaveBeenCalledWith(selectIsHaEnabled);
    });

    it('should set totalPoolCount based on pool query response', () => {
      expect(spectator.component.totalPoolCount).toBe(3); // fakeMultiplePools has 3 pools
    });
  });

  describe('HA warnings', () => {
    beforeEach(() => {
      // Mock Store to return HA enabled
      const mockStore$ = spectator.inject(Store);
      jest.spyOn(mockStore$, 'select').mockReturnValue(of(true));
    });

    it('should show HA warning when HA is enabled and this is the last pool', () => {
      spectator.component.totalPoolCount = 1; // Last pool
      spectator.component.isHaEnabled = true;
      spectator.component.selectOption(DisconnectOption.Export); // Select an option to show content
      spectator.detectChanges();

      expect(spectator.query('.ha-warning-panel')).toExist();
      expect(spectator.query('.ha-warning-panel')).toContainText('Critical: High Availability will be disabled');
      expect(spectator.query('.ha-warning')).toContainText('This is the last pool in your HA system');
      expect(spectator.query('.ha-warning')).toContainText('redundancy will be lost');
    });

    it('should not show HA warning when HA is enabled but multiple pools exist', () => {
      spectator.component.totalPoolCount = 3; // Multiple pools
      spectator.component.isHaEnabled = true;
      spectator.detectChanges();

      expect(spectator.query('.ha-warning-panel')).not.toExist();
    });

    it('should not show HA warning when HA is disabled', () => {
      spectator.component.totalPoolCount = 1; // Last pool
      spectator.component.isHaEnabled = false;
      spectator.detectChanges();

      expect(spectator.query('.ha-warning-panel')).not.toExist();
    });

    it('should show HA warning for delete option when HA and last pool', () => {
      spectator.component.totalPoolCount = 1; // Last pool
      spectator.component.isHaEnabled = true;
      spectator.click('.delete-option'); // Switch to delete
      spectator.detectChanges();

      expect(spectator.query('.ha-warning-panel')).toExist();
      expect(spectator.query('.ha-warning-panel')).toContainText('Critical: High Availability will be disabled');
    });
  });

  it('should show unknown status warning for pools with unknown status', () => {
    // Set the pool to unknown status and trigger the warning display
    spectator.component.pool = fakeUnknownPool;
    spectator.component.showUnknownStatusDetachWarning = true;
    spectator.component.showSysDatasetWarning = true; // Also needed for the system dataset panel to show
    spectator.component.systemConfig = { pool: 'fakePool' } as SystemDatasetConfig;

    // Need to re-trigger selectedOption to show the selected content
    spectator.component.selectOption(DisconnectOption.Export);
    spectator.detectChanges();

    expect(spectator.query('.unknown-status-warning')).toContainText('is in the database but not connected to the machine');
  });

  describe('pool summary', () => {
    beforeEach(() => {
      // Expand the pool summary panel to make content visible
      const panels = spectator.queryAll('mat-expansion-panel-header');
      const summaryPanel = panels.find((panel) => panel.textContent?.includes('These services and processes depend on this pool'));
      if (summaryPanel) {
        spectator.click(summaryPanel);
        spectator.detectChanges();
      }
    });

    it('should display pool summary when attachments or processes exist', () => {
      // Find the services panel specifically by its title text
      const servicesPanel = spectator.queryAll('.expansion-panel')
        .find((panel) => panel.textContent.includes('These services and processes depend on this pool'));
      expect(servicesPanel).toExist();
      expect(servicesPanel).toContainText('These services and processes depend on this pool');
    });

    it('should display attachments section', () => {
      expect(spectator.query('.attachments')).toContainText('These services depend on pool fakePool');
      expect(spectator.query('.attachments')).toContainText('SMB');
      expect(spectator.query('.attachments')).toContainText('share1');
      expect(spectator.query('.attachments')).toContainText('share2');
      expect(spectator.query('.attachments')).toContainText('share3');
      expect(spectator.query('.attachments')).toContainText('NFS');
      expect(spectator.query('.attachments')).toContainText('export1');
      expect(spectator.query('.attachments')).toContainText('export2');
      expect(spectator.query('.attachments')).toContainText('iSCSI');
      expect(spectator.query('.attachments')).toContainText('target1');
      expect(spectator.query('.attachments')).toContainText('Apps');
      expect(spectator.query('.attachments')).toContainText('nextcloud');
      expect(spectator.query('.attachments')).toContainText('plex');
      expect(spectator.query('.attachments')).toContainText('jellyfin');
    });

    it('should display known processes section', () => {
      expect(spectator.query('.known-processes')).toContainText('These running processes are using fakePool');
      expect(spectator.query('.known-processes')).toContainText('nginx');
      expect(spectator.query('.known-processes')).toContainText('postgres');
    });

    it('should display unknown processes section', () => {
      expect(spectator.query('.unknown-processes')).toContainText('These unknown processes are using the pool');
      expect(spectator.query('.unknown-processes')).toContainText('9999');
      expect(spectator.query('.unknown-processes')).toContainText('/some/unknown/process');
      expect(spectator.query('.process-will-be-terminated')).toContainText('WARNING:  These unknown processes will be terminated while exporting the pool.');
    });
  });


  async function submitExportForm(): Promise<void> {
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Delete saved configurations from TrueNAS?': true,
      'Confirm Export Pool': true,
    });

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Disconnect' }));
    await submitButton.click();
  }

  async function submitDeleteForm(): Promise<void> {
    spectator.click('.delete-option');
    spectator.detectChanges();

    // Wait for the name input to become available after selecting delete
    await spectator.fixture.whenStable();
    spectator.detectChanges();

    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Remove all related configurations': true,
      'Confirm Delete Pool': true,
      'Enter fakePool below to confirm': 'fakePool',
    });

    const submitButton = await loader.getHarness(MatButtonHarness.with({ text: 'Disconnect' }));
    await submitButton.click();
  }

  describe('form interactions', () => {
    it('shows initial state of checkboxes for export', async () => {
      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        'Delete saved configurations from TrueNAS?': true,
        'Confirm Export Pool': false,
      });
    });

    it('shows additional name input field for delete option', async () => {
      spectator.click('.delete-option');
      spectator.detectChanges();

      // Wait for the name input to become available after selecting delete
      await spectator.fixture.whenStable();
      spectator.detectChanges();

      const form = await loader.getHarness(IxFormHarness);
      const values = await form.getValues();

      expect(values).toEqual({
        'Remove all related configurations': true,
        'Confirm Delete Pool': false,
        'Enter fakePool below to confirm': '',
      });
    });

    it('sends correct export payload when export form is submitted', async () => {
      await submitExportForm();

      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Pool «fakePool» has been exported successfully.');
      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.export', [
        fakePool.id,
        {
          cascade: true,
          destroy: false,
          restart_services: false,
        },
      ]);
    });

    it('sends correct delete payload when delete form is submitted', async () => {
      await submitDeleteForm();

      expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Pool «fakePool» has been deleted successfully. All data on that pool was destroyed.');
      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('pool.export', [
        fakePool.id,
        {
          cascade: true,
          destroy: true,
          restart_services: false,
        },
      ]);
    });

    describe('error handling', () => {
      it('shows an error dialog when there are unstoppable processes', async () => {
        const dialog = spectator.inject(DialogService);
        jest.spyOn(dialog, 'jobDialog').mockReturnValue({
          afterClosed: () => throwError(() => {
            return new FailedJobError({
              error: 'Unstoppable processes',
              exc_info: {},
              extra: {
                code: 'unstoppable_processes',
                processes: 'docker',
              } as Record<string, unknown>,
            } as Job);
          }) as Observable<Job>,
        } as JobProgressDialogRef<unknown>);

        await submitExportForm();

        expect(spectator.inject(DialogService).error).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Error disconnecting/deleting pool.',
          message: 'Unable to terminate processes which are using this pool: docker',
        }));
      });

      it('shows services restart dialog when services need to be restarted', async () => {
        const dialog = spectator.inject(DialogService);
        jest.spyOn(dialog, 'jobDialog').mockReturnValue({
          afterClosed: () => throwError(() => {
            return new FailedJobError({
              error: 'Control services error',
              exc_info: {
                extra: {
                  code: 'control_services',
                  restart_services: ['cifs', 'iscsi'],
                  stop_services: ['docker'],
                } as Record<string, unknown>,
              },
            } as Job);
          }) as Observable<Job>,
        } as JobProgressDialogRef<unknown>);

        await submitExportForm();

        expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(ServicesToBeRestartedDialogComponent, {
          data: {
            code: 'control_services',
            restart_services: ['cifs', 'iscsi'],
            stop_services: ['docker'],
          },
        });
      });

      it('calls pool.export with restart_services=true when user confirms service restart', async () => {
        const dialog = spectator.inject(DialogService);
        jest.spyOn(dialog, 'jobDialog').mockReturnValueOnce({
          afterClosed: () => throwError(() => {
            return new FailedJobError({
              error: 'Control services error',
              exc_info: {
                extra: {
                  code: 'control_services',
                  restart_services: ['cifs', 'iscsi'],
                  stop_services: ['docker'],
                } as Record<string, unknown>,
              },
            } as Job);
          }) as Observable<Job>,
        } as JobProgressDialogRef<unknown>);

        jest.spyOn(spectator.inject(MatDialog), 'open').mockReturnValue({
          afterClosed: () => of(true),
        } as unknown as MatDialogRef<ServicesToBeRestartedDialogComponent>);

        await submitExportForm();

        expect(spectator.inject(ApiService).job).toHaveBeenLastCalledWith('pool.export', [
          fakePool.id,
          {
            cascade: true,
            destroy: false,
            restart_services: true,
          },
        ]);
      });
    });
  });

  describe('Last pool scenario (single pool system)', () => {
    let singlePoolSpectator: Spectator<ExportDisconnectModalComponent>;

    const createSinglePoolComponent = createComponentFactory({
      component: ExportDisconnectModalComponent,
      imports: [ReactiveFormsModule],
      providers: [
        mockApi([
          mockCall('pool.attachments', []),
          mockCall('pool.processes', []),
          mockCall('systemdataset.config', { pool: 'fakePool' } as SystemDatasetConfig),
          mockCall('pool.query', fakeSinglePool), // Only one pool
          mockJob('pool.export'),
        ]),
        mockProvider(DialogService, {
          jobDialog: jest.fn(() => ({ afterClosed: () => of(null) })),
          error: jest.fn(),
        }),
        mockProvider(MatDialogRef),
        mockProvider(MatDialog),
        mockProvider(LoaderService, {
          withLoader: jest.fn(() => (source$: Observable<unknown>) => source$),
        }),
        mockProvider(DatasetTreeStore, { resetDatasets: jest.fn() }),
        mockProvider(ErrorHandlerService, {
          withErrorHandler: jest.fn(() => (source$: Observable<unknown>) => source$),
          showErrorModal: jest.fn(),
        }),
        mockAuth(),
        mockProvider(SnackbarService, { success: jest.fn() }),
        mockProvider(Store, {
          select: jest.fn((selector) => {
            if (selector === selectIsHaEnabled) {
              return of(true); // HA enabled for this test
            }
            return of(null);
          }),
        }),
      ],
      componentProviders: [
        { provide: MAT_DIALOG_DATA, useValue: fakePool },
      ],
    });

    beforeEach(async () => {
      singlePoolSpectator = createSinglePoolComponent();
      await singlePoolSpectator.fixture.whenStable();
      singlePoolSpectator.detectChanges();
    });

    it('should show HA warning for last pool in HA system', () => {
      expect(singlePoolSpectator.component.totalPoolCount).toBe(1);
      expect(singlePoolSpectator.component.isLastPool).toBe(true);
      expect(singlePoolSpectator.component.shouldShowHaWarning).toBe(true);

      expect(singlePoolSpectator.query('.ha-warning-panel')).toExist();
      expect(singlePoolSpectator.query('.ha-warning-panel')).toContainText('Critical: High Availability will be disabled');
    });

    it('should show system dataset warning message', () => {
      // Look specifically for the system dataset panel (not the HA warning panel)
      const systemDatasetPanel = singlePoolSpectator.queryAll('.expansion-panel')
        .find((panel) => panel.textContent.includes('System dataset will be moved off this pool'));
      expect(systemDatasetPanel).toExist();
    });
  });
});
