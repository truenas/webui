import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { scaleDownloadUrl } from 'app/constants/links.constants';
import { mockApi, mockCall, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { JobState } from 'app/enums/job-state.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { UpdateStatus } from 'app/interfaces/system-update.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { SaveConfigDialog } from 'app/pages/system/advanced/manage-configuration-menu/save-config-dialog/save-config-dialog.component';
import { UpdateService } from 'app/pages/system/update/services/update.service';
import { UpdateComponent } from 'app/pages/system/update/update.component';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

const mockDialogRef = {
  close: jest.fn(),
  afterClosed: () => of(true),
} as unknown as MatDialogRef<unknown>;

describe('UpdateComponent', () => {
  let spectator: Spectator<UpdateComponent>;
  let loader: HarnessLoader;

  const updatesAvailable$ = new BehaviorSubject(false);
  const updateDownloaded$ = new BehaviorSubject(false);
  const status$ = new BehaviorSubject(SystemUpdateStatus.Unavailable);
  const changeLog$ = new BehaviorSubject('Changelog content');
  const releaseNotesUrl$ = new BehaviorSubject('http://release.notes.url');
  const updateVersion$ = new BehaviorSubject('22.12.3');
  const currentTrainDescription$ = new BehaviorSubject('');

  const createComponent = createComponentFactory({
    component: UpdateComponent,
    declarations: [
      MockComponents(
        PageHeaderComponent,
      ),
    ],
    providers: [
      mockApi([
        mockCall('core.get_jobs', []),
        mockCall('update.status', {
          code: SystemUpdateStatus.Normal,
          status: {
            current_version: { train: '', profile: '', matches_profile: true },
            new_version: {
              version: '22.12.3',
              manifest: {
                filename: '', version: '22.12.3', date: '', changelog: '', checksum: '', filesize: 0, profile: '', train: '',
              },
              release_notes_url: '',
            },
          },
          error: null,
          update_download_progress: null,
        } as UpdateStatus),
        mockJob('update.update'),
        mockCall('system.product_type', ProductType.CommunityEdition),
        mockCall('webui.main.dashboard.sys_info', {
          version: '22.12.3',
        } as SystemInfo),
      ]),
      mockAuth(),
      provideMockStore({
        selectors: [
          {
            selector: selectIsEnterprise,
            value: false,
          },
        ],
      }),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockDialogRef),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of({
          confirmed: true,
          secondaryCheckbox: true,
        })),
        jobDialog: jest.fn(() => ({
          afterClosed: () => of({}),
        })),
      }),
      mockProvider(Router),
      mockProvider(UpdateService, {
        updatesAvailable$,
        updateDownloaded$,
        status$,
        getUpdateStatus: jest.fn(() => of({
          code: SystemUpdateStatus.Available,
          status: {
            new_version: {
              version: '22.12.3',
            },
          },
          error: null,
          update_download_progress: null,
        })),
        changeLog$,
        releaseNotesUrl$,
        checkIfUpdateIsDownloaded: jest.fn(),
        getUpdateConfig: jest.fn(() => of({ id: 1, autocheck: false, profile: 'general' })),
        updateConfig: jest.fn(() => of({ id: 1, autocheck: true, profile: 'general' })),
        getProfileChoices: jest.fn(() => of({
          general: {
            name: 'General', footnote: '', description: '', available: true,
          },
        })),
        checkForUpdates: jest.fn(),
        currentTrainDescription$,
        updateVersion$,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('displays current version', () => {
    spectator.detectChanges();
    const allHeadings = spectator.queryAll('h4');
    const versionElement = allHeadings.find((el) => el.textContent?.includes('Current version'));
    expect(versionElement).toHaveText('Current version: 22.12.3');
  });

  it('shows "Update Available" when updatesAvailable$ is true', async () => {
    updatesAvailable$.next(true);
    updateDownloaded$.next(false);
    status$.next(SystemUpdateStatus.Available);
    spectator = createComponent();
    spectator.detectChanges();

    const heading = spectator.query('h2');
    expect(heading).toHaveText('Update Available');

    const downloadUpdatesButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install Update' }));
    await downloadUpdatesButton.click();

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('core.get_jobs', [
      [['method', '=', 'update.update'], ['state', '=', JobState.Running]],
    ]);

    expect(spectator.inject(UpdateService).getUpdateStatus).toHaveBeenCalled();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SaveConfigDialog, {
      data: {
        cancelButton: 'Do not save',
        saveButton: 'Save Configuration',
        title: 'Save configuration settings from this machine before updating?',
      },
    });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      buttonText: 'Download',
      hideCheckbox: true,
      message: 'Continue with download?',
      secondaryCheckbox: true,
      secondaryCheckboxText: 'Apply updates and restart system after downloading.',
      title: 'Download Update',
    });

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('update.update', [{ reboot: true, resume: false }]);
  });

  it('shows "Pending Update" when updateDownloaded$ is true and status is not Unavailable', async () => {
    updatesAvailable$.next(false);
    updateDownloaded$.next(true);
    status$.next(SystemUpdateStatus.Available);
    spectator = createComponent();
    spectator.detectChanges();

    const heading = spectator.query('h2');
    expect(heading).toHaveText('Pending Update');

    const applyPendingButton = await loader.getHarness(MatButtonHarness.with({ text: 'Apply Pending Update' }));
    await applyPendingButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SaveConfigDialog, {
      data: {
        cancelButton: 'Do not save',
        saveButton: 'Save Configuration',
        title: 'Save configuration settings from this machine before updating?',
      },
    });

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      message: 'The system will restart and be briefly unavailable while applying updates. Apply updates and restart?',
      title: 'Apply Pending Updates',
    });

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('update.update', [{ reboot: true, resume: false }]);
  });

  it('shows "Installed Version" title and up-to-date message when no updates or pending updates', () => {
    updatesAvailable$.next(false);
    updateDownloaded$.next(false);
    status$.next(SystemUpdateStatus.Unavailable);

    spectator = createComponent();
    spectator.detectChanges();

    const heading = spectator.query('h2');
    expect(heading).toHaveText('Installed Version');

    const allHeadings = spectator.queryAll('h4');

    const upToDateMessage = allHeadings.find((el) => el.textContent?.includes('System is up to date!'));
    expect(upToDateMessage).toHaveText('System is up to date!');
  });

  it('shows reboot required message when update status is RebootRequired', () => {
    status$.next(SystemUpdateStatus.RebootRequired);
    updatesAvailable$.next(false);
    updateDownloaded$.next(false);

    spectator = createComponent();
    spectator.detectChanges();

    const rebootMessage = spectator.query('h4.hint');
    expect(rebootMessage).toHaveText('An update is already applied. Please restart the system.');
  });

  it('renders update summary with version, changelog and release notes', () => {
    updatesAvailable$.next(true);
    status$.next(SystemUpdateStatus.Available);

    spectator.detectChanges();

    const summaryTitle = spectator.query('.update-summary h3');
    expect(summaryTitle).toHaveText('Update Summary for 22.12.3');

    const allHeadings = spectator.queryAll('p.train-warning');

    const trainWarning = allHeadings.find((el) => el.textContent?.includes('Selected train does not have production releases'));
    expect(trainWarning).toHaveText(
      'Selected train does not have production releases, and should only be used for testing.',
    );

    const changelog = spectator.query('.update-summary');
    expect(changelog?.innerHTML).toContain('Changelog content');

    const releaseNotesLink = spectator.query('a.release-notes-link');
    expect(releaseNotesLink).toHaveAttribute('href', 'http://release.notes.url');
  });

  it('renders "Other Options" section and triggers manual update on button click', async () => {
    spectator.detectChanges();

    const h3 = spectator.query('.other-options h3');
    expect(h3).toHaveText('Other Options');

    const h4 = spectator.query('.other-options h4');
    expect(h4).toHaveText('Manual Update');

    const paragraph = spectator.query('.manual-update p');
    expect(paragraph?.textContent).toContain('See the manual image installation guide');

    const link = spectator.query('.manual-update a');
    expect(link).toHaveAttribute('href', scaleDownloadUrl);

    const installManualButton = await loader.getHarness(MatButtonHarness.with({ text: 'Install' }));
    await installManualButton.click();

    expect(spectator.inject(MatDialog).open).toHaveBeenCalledWith(SaveConfigDialog, {
      data: {
        cancelButton: 'Do not save',
        saveButton: 'Save Configuration',
        title: 'Save configuration settings from this machine before updating?',
      },
    });

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/system/update/manualupdate']);
  });

  it('renders ix-update-profile-card', () => {
    spectator.detectChanges();

    const updateProfileCard = spectator.query('ix-update-profile-card');

    expect(updateProfileCard).toBeTruthy();
  });
});
