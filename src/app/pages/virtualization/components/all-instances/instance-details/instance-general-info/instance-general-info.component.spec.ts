import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VirtualizationStatus, VirtualizationType } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import {
  InstanceGeneralInfoComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-general-info/instance-general-info.component';
import {
  InstanceEditFormComponent,
} from 'app/pages/virtualization/components/instance-edit-form/instance-edit-form.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ApiService } from 'app/services/api.service';
import { SlideInService } from 'app/services/slide-in.service';

const demoInstance = {
  id: 'demo',
  name: 'Demo',
  type: VirtualizationType.Container,
  status: VirtualizationStatus.Running,
  cpu: '525',
  autostart: true,
  image: {
    archs: ['amd64'],
    description: 'Almalinux 8 amd64 (20241030_23:38)',
    os: 'Almalinux',
    release: '8',
  },
  memory: 131072000,
  environment: {
    TEST_ENV: 'value1',
    SAMPLE_ENV: 'value2',
  },
} as unknown as VirtualizationInstance;

describe('InstanceGeneralInfoComponent', () => {
  let spectator: Spectator<InstanceGeneralInfoComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: InstanceGeneralInfoComponent,
    providers: [
      mockAuth(),
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => {
          return {
            afterClosed: jest.fn(() => of()),
          };
        }),
        confirm: () => of(true),
      }),
      mockProvider(SlideInService, {
        open: jest.fn(),
      }),
      mockApi([
        mockJob('virt.instance.delete'),
      ]),
      mockProvider(VirtualizationInstancesStore, {
        selectedInstance: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        instance: demoInstance,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks card title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('General Info');
  });

  it('renders details in card', () => {
    const chartExtra = spectator.query('mat-card-content').querySelectorAll('p');
    expect(chartExtra).toHaveLength(6);
    expect(chartExtra[0]).toHaveText('Status: Running');
    expect(chartExtra[1]).toHaveText('Autostart: Yes');
    expect(chartExtra[2]).toHaveText('Base Image: Almalinux 8 amd64 (20241030_23:38)');
    expect(chartExtra[3]).toHaveText('CPU: 525');
    expect(chartExtra[4]).toHaveText('Memory: 125 MiB');
    expect(chartExtra[5]).toHaveText('Environment:');
  });

  it('renders environment variables', () => {
    const envContainer = spectator.query('mat-card-content').querySelectorAll('ul li');
    expect(envContainer).toHaveLength(2);
    expect(envContainer[0]).toHaveText('SAMPLE_ENV: value2');
    expect(envContainer[1]).toHaveText('TEST_ENV: value1');
  });

  it('deletes instance when "Delete" button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenLastCalledWith('virt.instance.delete', ['demo']);
  });

  it('opens edit instance form when Edit is pressed', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(InstanceEditFormComponent, {
      data: demoInstance,
    });
  });
});
