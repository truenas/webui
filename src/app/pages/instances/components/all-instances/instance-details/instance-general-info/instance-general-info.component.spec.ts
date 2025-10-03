import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { KeyValuePipe } from '@angular/common';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { VirtualizationStatus } from 'app/enums/virtualization.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  InstanceGeneralInfoComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-general-info/instance-general-info.component';
import { InstanceFormComponent } from 'app/pages/instances/components/instance-form/instance-form.component';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { fakeVirtualizationInstance } from 'app/pages/instances/utils/fake-virtualization-instance.utils';

const instance = fakeVirtualizationInstance({
  id: 1,
  name: 'Demo',
  autostart: true,
  memory: 512,
  cpuset: '0-3',
  status: {
    state: VirtualizationStatus.Running,
    pid: 1234,
    domain_state: null,
  },
});

describe('InstanceGeneralInfoComponent', () => {
  let spectator: Spectator<InstanceGeneralInfoComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: InstanceGeneralInfoComponent,
    imports: [RequiresRolesDirective, YesNoPipe, MapValuePipe, KeyValuePipe],
    providers: [
      IxFormatterService,
      mockAuth(),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({
          response: true,
        })),
      }),
      mockProvider(VirtualizationInstancesStore, {
        selectedInstance: jest.fn(),
        instanceUpdated: jest.fn(),
        initialize: jest.fn(),
      }),
      mockApi([
        mockCall('container.delete'),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
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
    const cardContent = spectator.query('mat-card-content');
    expect(cardContent).toContainText('Autostart: Yes');
    expect(cardContent).toContainText('CPU Set: 0-3');
    expect(cardContent).toContainText('Memory: 512 MB');
  });

  it('renders correct values when CPU Set or Memory limit is not set', () => {
    spectator.setInput('instance', fakeVirtualizationInstance({
      cpuset: null,
      memory: null,
    }));

    const cardContent = spectator.query('mat-card-content');
    expect(cardContent).toContainText('CPU Set: All Host CPUs');
    expect(cardContent).toContainText('Memory: Available Host Memory');
  });

  it('deletes instance when "Delete" button is pressed and redirects to list root', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('container.delete', [1]);

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/containers'], { state: { hideMobileDetails: true } });
  });

  it('opens edit instance form when Edit is pressed', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(InstanceFormComponent, { data: instance });
    expect(spectator.inject(VirtualizationInstancesStore).initialize).toHaveBeenCalled();
  });

  it('does not delete instance when confirmation is cancelled', async () => {
    const dialogService = spectator.inject(DialogService);
    (dialogService.confirm as jest.Mock).mockReturnValue(of(false));

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('container.delete', [1]);
    expect(spectator.inject(Router).navigate).not.toHaveBeenCalled();
  });

  it('shows capabilities policy when available', () => {
    spectator.setInput('instance', fakeVirtualizationInstance({
      capabilities_policy: 'ALLOW',
    }));

    const cardContent = spectator.query('mat-card-content');
    expect(cardContent).toContainText('Capabilities Policy: Allow');
  });
});
