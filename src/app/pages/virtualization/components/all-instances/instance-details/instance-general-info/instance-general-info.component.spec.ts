import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { KeyValuePipe } from '@angular/common';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatTooltipHarness } from '@angular/material/tooltip/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { fakeSuccessfulJob } from 'app/core/testing/utils/fake-job.utils';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { VirtualizationStatus, VirtualizationType } from 'app/enums/virtualization.enum';
import { VirtualizationAlias, VirtualizationImage, VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import {
  InstanceEditFormComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-general-info/instance-edit-form/instance-edit-form.component';
import {
  InstanceGeneralInfoComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-general-info/instance-general-info.component';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';

const instance = {
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
  } as VirtualizationImage,
  memory: 131072000,
  environment: {
    TEST_ENV: 'value1',
    SAMPLE_ENV: 'value2',
  },
  aliases: {} as VirtualizationAlias,
  raw: null,
} as VirtualizationInstance;

describe('InstanceGeneralInfoComponent', () => {
  let spectator: Spectator<InstanceGeneralInfoComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: InstanceGeneralInfoComponent,
    imports: [RequiresRolesDirective, YesNoPipe, MapValuePipe, KeyValuePipe],
    declarations: [
      MockComponent(InstanceEditFormComponent),
    ],
    providers: [
      IxFormatterService,
      mockAuth(),
      mockProvider(ChainedSlideInService, {
        open: jest.fn(() => of({
          response: { id: 'updated_instance' },
        })),
      }),
      mockProvider(VirtualizationDevicesStore, {
        selectedInstance: jest.fn(),
      }),
      mockProvider(VirtualizationInstancesStore, {
        instanceUpdated: jest.fn(),
      }),
      mockApi([
        mockJob('virt.instance.delete', fakeSuccessfulJob()),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({
          afterClosed: jest.fn(() => of({})),
        })),
      }),
      mockProvider(Router),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: { instance },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('checks card title', () => {
    const title = spectator.query('h3');
    expect(title).toHaveText('General Info');
  });

  it('renders details in card', () => {
    const chartExtra = spectator.query('mat-card-content').querySelectorAll('p');
    expect(chartExtra).toHaveLength(5);
    expect(chartExtra[0]).toHaveText('Status: Running');
    expect(chartExtra[1]).toHaveText('Autostart: Yes');
    expect(chartExtra[2]).toHaveText('Base Image: Almalinux 8 amd64 (20241030_23:38)');
    expect(chartExtra[3]).toHaveText('CPU: 525');
    expect(chartExtra[4]).toHaveText('Memory: 125 MiB');
  });

  it('renders correct values when CPU or Memory limit is not set', () => {
    spectator.setInput('instance', {
      ...instance,
      cpu: null,
      memory: null,
    });

    const chartExtra = spectator.query('mat-card-content').querySelectorAll('p');

    expect(chartExtra[3]).toHaveText('CPU: All Host CPUs');
    expect(chartExtra[4]).toHaveText('Memory: Available Host Memory');
  });

  it('renders environment variables a text with tooltip', async () => {
    const environmentVariables = spectator.query('.environment-variables');
    expect(environmentVariables).toHaveText('2 Environment Variables');

    const tooltip = await loader.getHarness(MatTooltipHarness.with({ selector: '.environment-variables' }));
    await tooltip.show();
    expect(await tooltip.getTooltipText()).toBe('TEST_ENV = value1\nSAMPLE_ENV = value2');
  });

  it('deletes instance when "Delete" button is pressed and redirects to list root', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(ApiService).job).toHaveBeenLastCalledWith('virt.instance.delete', ['demo']);

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/virtualization'], { state: { hideMobileDetails: true } });
  });

  it('opens edit instance form when Edit is pressed', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(ChainedSlideInService).open)
      .toHaveBeenCalledWith(InstanceEditFormComponent, false, instance);
    expect(spectator.inject(VirtualizationInstancesStore).instanceUpdated)
      .toHaveBeenCalledWith({ id: 'updated_instance' });
    expect(spectator.inject(VirtualizationDevicesStore).selectInstance)
      .toHaveBeenCalledWith('updated_instance');
  });
});
