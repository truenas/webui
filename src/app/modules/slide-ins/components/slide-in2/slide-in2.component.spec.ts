import { A11yModule } from '@angular/cdk/a11y';
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ElementRef, Renderer2 } from '@angular/core';
import { tick, fakeAsync, discardPeriodicTasks } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator, createComponentFactory, mockProvider } from '@ngneat/spectator/jest';
import { Subject, of } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { CloudSyncProviderName } from 'app/enums/cloudsync-provider.enum';
import { Direction } from 'app/enums/direction.enum';
import { JobState } from 'app/enums/job-state.enum';
import { TransferMode } from 'app/enums/transfer-mode.enum';
import { CloudSyncTaskUi } from 'app/interfaces/cloud-sync-task.interface';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { CloudCredentialsSelectComponent } from 'app/modules/forms/custom-selects/cloud-credentials-select/cloud-credentials-select.component';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { SlideIn2Component } from 'app/modules/slide-ins/components/slide-in2/slide-in2.component';
import { CloudSyncFormComponent } from 'app/pages/data-protection/cloudsync/cloudsync-form/cloudsync-form.component';
import { TransferModeExplanationComponent } from 'app/pages/data-protection/cloudsync/transfer-mode-explanation/transfer-mode-explanation.component';
import { ChainedComponentResponse, ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { FilesystemService } from 'app/services/filesystem.service';

describe('IxSlideIn2Component', () => {
  const existingTask = {
    id: 1,
    description: 'New Cloud Sync Task',
    direction: Direction.Push,
    path: '/mnt/my pool',
    attributes: { folder: '/test/' } as Record<string, string>,
    enabled: false,
    transfer_mode: TransferMode.Copy,
    encryption: true,
    filename_encryption: true,
    encryption_password: 'password',
    encryption_salt: 'salt',
    args: '',
    post_script: 'test post-script',
    pre_script: 'test pre-script',
    snapshot: false,
    bwlimit: [
      { time: '13:00', bandwidth: 1024 },
      { time: '15:00' },
    ],
    include: [],
    exclude: [],
    transfers: 2,
    create_empty_src_dirs: true,
    follow_symlinks: true,
    credentials: {
      id: 2,
      name: 'test2',
      provider: {
        type: CloudSyncProviderName.Mega,
        user: 'login',
        pass: 'password',
      },
    } as CloudSyncCredential,
    schedule: {
      minute: '0',
      hour: '0',
      dom: '*',
      month: '*',
      dow: '0',
    },
    locked: false,
    job: null,
    credential: 'test2',
    cron_schedule: 'Disabled',
    frequency: 'At 00:00, only on Sunday',
    next_run_time: 'Disabled',
    next_run: 'Disabled',
    state: { state: JobState.Pending },
  } as CloudSyncTaskUi;
  const close$ = new Subject<ChainedComponentResponse>();
  let spectator: Spectator<SlideIn2Component>;
  let loader: HarnessLoader;
  const createComponent = createComponentFactory({
    component: SlideIn2Component,
    imports: [
      A11yModule,
      CloudSyncFormComponent,
      CloudCredentialsSelectComponent,
      ReactiveFormsModule,
      TransferModeExplanationComponent,
    ],
    providers: [
      mockAuth(),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: jest.fn(() => of(true)),
        })),
      }),
      mockApi([
        mockCall('cloudsync.create', existingTask),
        mockCall('cloudsync.update', existingTask),
        mockCall('cloudsync.credentials.query', [
          {
            id: 1,
            name: 'test1',
            provider: {
              type: CloudSyncProviderName.Http,
              url: 'http',
            },
          },
          {
            id: 2,
            name: 'test2',
            provider: {
              type: CloudSyncProviderName.Mega,
              user: 'login',
              pass: 'password',
            },
          },
        ]),
        mockCall('cloudsync.providers', [{
          name: CloudSyncProviderName.Http,
          title: 'Http',
          buckets: false,
          bucket_title: 'Bucket',
          task_schema: [],
          credentials_schema: [],
          credentials_oauth: null,
        },
        {
          name: CloudSyncProviderName.Mega,
          title: 'Mega',
          buckets: false,
          bucket_title: 'Bucket',
          task_schema: [],
          credentials_schema: [],
          credentials_oauth: null,
        }]),
      ]),
      mockProvider(FilesystemService),
      mockProvider(ChainedRef, {
        close: jest.fn(),
        requireConfirmationWhen: jest.fn(),
        getData: jest.fn(() => undefined),
        swap: jest.fn(),
      }),
      mockProvider(ElementRef),
      mockProvider(Renderer2),
      mockProvider(ChainedSlideInService, {
        isTopComponentWide$: of(false),
        popComponent: jest.fn(),
        swapComponent: jest.fn(),
        open: jest.fn(() => of()),
        components$: of([]),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
      }),
    ],
  });

  beforeAll(() => {
    Object.defineProperty(close$, 'next', {
      value: jest.fn(),
    });
    Object.defineProperty(close$, 'complete', {
      value: jest.fn(),
    });
  });

  function setupComponent(): void {
    spectator = createComponent({
      props: {
        componentInfo: {
          close$,
          component: CloudSyncFormComponent,
          id: 'id',
          data: undefined,
          isComponentAlive: true,
          wide: false,
        },
        index: 0,
        lastIndex: 0,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    tick(10);
  }

  it('close slide-in when backdrop is clicked', fakeAsync(() => {
    setupComponent();
    const backdrop = spectator.query('.ix-slide-in2-background');
    backdrop.dispatchEvent(new Event('click'));
    spectator.detectChanges();
    expect(close$.next).toHaveBeenCalledWith({ response: false, error: null });
    expect(close$.complete).toHaveBeenCalled();
    tick(305);
    expect(spectator.inject(ChainedSlideInService).popComponent).toHaveBeenCalledWith('id');
    discardPeriodicTasks();
  }));

  it('opens the slide in component', fakeAsync(() => {
    setupComponent();
    const form = spectator.query(CloudSyncFormComponent);
    expect(form).toExist();
  }));

  it('asks for confirmation when require confirmation method setup', fakeAsync(() => {
    setupComponent();
    const form = spectator.query(CloudSyncFormComponent);
    form.form.markAsDirty();
    spectator.detectChanges();
    const backdrop = spectator.query('.ix-slide-in2-background');
    backdrop.dispatchEvent(new Event('click'));

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalledWith({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to close?',
      cancelText: 'No',
      buttonText: 'Yes',
      buttonColor: 'red',
      hideCheckbox: true,
    });
    discardPeriodicTasks();
  }));

  it('doesnt ask for confirmation when form is saved', fakeAsync(async () => {
    setupComponent();
    const form = spectator.query(CloudSyncFormComponent);
    form.form.patchValue({
      description: 'New Cloud Sync Task',
      credentials: 1,
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();
    form.form.markAsDirty();
    spectator.detectChanges();
    const backdrop = spectator.query('.ix-slide-in2-background');
    backdrop.dispatchEvent(new Event('click'));

    expect(spectator.inject(DialogService).confirm).not.toHaveBeenCalledWith({
      title: 'Unsaved Changes',
      message: 'You have unsaved changes. Are you sure you want to close?',
      cancelText: 'No',
      buttonText: 'Yes',
      buttonColor: 'red',
      hideCheckbox: true,
    });
    discardPeriodicTasks();
  }));
});
