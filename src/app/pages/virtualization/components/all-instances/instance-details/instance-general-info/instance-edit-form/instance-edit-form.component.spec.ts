import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import {
  createComponentFactory,
  mockProvider,
  Spectator,
} from '@ngneat/spectator/jest';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GiB } from 'app/constants/bytes.constant';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Job } from 'app/interfaces/job.interface';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ChainedRef } from 'app/modules/slide-ins/chained-component-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { InstanceEditFormComponent } from 'app/pages/virtualization/components/all-instances/instance-details/instance-general-info/instance-edit-form/instance-edit-form.component';
import { ApiService } from 'app/services/websocket/api.service';

describe('InstanceEditFormComponent', () => {
  let spectator: Spectator<InstanceEditFormComponent>;
  let loader: HarnessLoader;
  let form: IxFormHarness;

  const mockInstance = {
    id: 'test',
    name: 'test',
    autostart: false,
    cpu: '1-3',
    memory: 2 * GiB,
    environment: null,
  } as VirtualizationInstance;

  const createComponent = createComponentFactory({
    component: InstanceEditFormComponent,
    providers: [
      mockAuth(),
      mockApi([
        mockJob('virt.instance.update', fakeSuccessfulJob({ id: 'test' } as VirtualizationInstance)),
      ]),
      mockProvider(SnackbarService),
      mockProvider(DialogService, {
        jobDialog: jest.fn((request$: Observable<Job>) => ({
          afterClosed: () => request$.pipe(
            map((job) => ({
              ...job,
              result: {
                id: 'updated_instance',
                autostart: true,
                cpu: '2-5',
                memory: GiB,
                environment: {},
              },
            })),
          ),
        })),
      }),
      mockProvider(ChainedRef, {
        getData: () => mockInstance,
        close: jest.fn(),
      }),
    ],
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);
  });

  it('loads instance data in edit mode and populates the form', async () => {
    expect(await form.getValues()).toMatchObject({
      Autostart: false,
      'CPU Configuration': '1-3',
      'Memory Size': '2 GiB',
    });
  });

  it('updates an instance when form is submitted', async () => {
    await form.fillForm({
      Autostart: true,
      'CPU Configuration': '2-5',
      'Memory Size': '1 GiB',
    });

    const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
    await saveButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('virt.instance.update', ['test', {
      autostart: true,
      cpu: '2-5',
      memory: GiB,
      environment: {},
    }]);
    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
    expect(spectator.inject(ChainedRef).close).toHaveBeenCalledWith({
      response: {
        id: 'updated_instance',
        autostart: true,
        cpu: '2-5',
        memory: GiB,
        environment: {},
      },
      error: false,
    });
  });
});
