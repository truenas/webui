import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { InstanceGeneralInfoComponent } from 'app/pages/virtualization/components/all-instances/instance-details/instance-general-info/instance-general-info.component';
import { InstanceEditFormComponent } from 'app/pages/virtualization/components/instance-edit-form/instance-edit-form.component';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { SlideInService } from 'app/services/slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

const demoInstance = {
  id: 'demo',
  name: 'Demo',
  type: 'CONTAINER',
  status: 'RUNNING',
  cpu: '525',
  autostart: true,
  image: {
    archs: ['amd64'],
    description: 'Almalinux 8 amd64 (20241030_23:38)',
    os: 'Almalinux',
    release: '8',
  },
  memory: 131072000,
} as VirtualizationInstance;

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
      mockWebSocket([
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
    expect(chartExtra[0]).toHaveText('Name: Demo');
    expect(chartExtra[1]).toHaveText('Status: Running');
    expect(chartExtra[2]).toHaveText('Autostart: Yes');
    expect(chartExtra[3]).toHaveText('Base Image: Almalinux 8 amd64 (20241030_23:38)');
    expect(chartExtra[4]).toHaveText('CPU: 525');
    expect(chartExtra[5]).toHaveText('Memory: 125 MiB');
  });

  it('deletes instance when "Delete" button is pressed', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).job).toHaveBeenLastCalledWith('virt.instance.delete', ['demo']);
  });

  it('navigates to app edit page when Edit button is pressed', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(SlideInService).open).toHaveBeenCalledWith(InstanceEditFormComponent, {
      data: demoInstance,
    });
  });
});
