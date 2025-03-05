import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { GiB } from 'app/constants/bytes.constant';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockApi, mockJob } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VirtualizationStatus, VirtualizationType } from 'app/enums/virtualization.enum';
import { Job } from 'app/interfaces/job.interface';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  InstanceEditFormComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-general-info/instance-edit-form/instance-edit-form.component';

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
    environment: {},
    type: VirtualizationType.Vm,
    vnc_enabled: true,
    vnc_port: 9001,
    status: VirtualizationStatus.Stopped,
    vnc_password: null,
    secure_boot: true,
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
                enable_vnc: true,
                vnc_port: 9000,
                vnc_password: 'testing',
              },
            })),
          ),
        })),
      }),
      mockProvider(SlideInRef, {
        getData: () => mockInstance,
        requireConfirmationWhen: jest.fn(),
        close: jest.fn(),
      }),
    ],
  });

  describe('normal form operations', () => {
    beforeEach(async () => {
      spectator = createComponent();
      loader = TestbedHarnessEnvironment.loader(spectator.fixture);
      form = await loader.getHarness(IxFormHarness);
    });

    it('loads instance data in edit mode and populates the form', async () => {
      expect(await form.getValues()).toEqual({
        Autostart: false,
        'CPU Configuration': '1-3',
        'Memory Size': '2 GiB',
        'Enable VNC': true,
        'VNC Port': '9001',
        'VNC Password': '',
        'Secure Boot': true,
      });
    });

    it('updates an instance when form is submitted', async () => {
      await form.fillForm({
        Autostart: true,
        'CPU Configuration': '2-5',
        'Memory Size': '1 GiB',
        'VNC Port': 9000,
        'VNC Password': 'testing',
        'Secure Boot': false,
      });

      const saveButton = await loader.getHarness(MatButtonHarness.with({ text: 'Save' }));
      await saveButton.click();

      expect(spectator.inject(ApiService).job).toHaveBeenCalledWith('virt.instance.update', ['test', {
        autostart: true,
        cpu: '2-5',
        memory: GiB,
        enable_vnc: true,
        vnc_port: 9000,
        vnc_password: 'testing',
        secure_boot: false,
      }]);
      expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
      expect(spectator.inject(SnackbarService).success).toHaveBeenCalled();
      expect(spectator.inject(SlideInRef).close).toHaveBeenCalledWith({
        response: {
          id: 'updated_instance',
          autostart: true,
          cpu: '2-5',
          memory: GiB,
          environment: {},
          enable_vnc: true,
          vnc_port: 9000,
          vnc_password: 'testing',
        },
        error: false,
      });
    });
  });

  it('marks Enable VNC as disabled when instance is not stopped', async () => {
    spectator = createComponent({
      providers: [
        mockProvider(SlideInRef, {
          getData: () => ({
            ...mockInstance,
            status: VirtualizationStatus.Running,
          }),
          requireConfirmationWhen: jest.fn(),
          close: jest.fn(),
        }),
      ],
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    form = await loader.getHarness(IxFormHarness);

    expect(await (await form.getControl('Enable VNC')).isDisabled()).toBe(true);
  });
});
