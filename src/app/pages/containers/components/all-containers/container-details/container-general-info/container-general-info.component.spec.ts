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
import { ContainerStatus } from 'app/enums/container.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ContainerGeneralInfoComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-general-info/container-general-info.component';
import { ContainerFormComponent } from 'app/pages/containers/components/container-form/container-form.component';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';

const container = fakeContainer({
  id: 1,
  name: 'Demo',
  autostart: true,
  cpuset: '0-3',
  status: {
    state: ContainerStatus.Running,
    pid: 1234,
    domain_state: null,
  },
});

describe('ContainerGeneralInfoComponent', () => {
  let spectator: Spectator<ContainerGeneralInfoComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: ContainerGeneralInfoComponent,
    imports: [RequiresRolesDirective, YesNoPipe, MapValuePipe, KeyValuePipe],
    providers: [
      IxFormatterService,
      mockAuth(),
      mockProvider(SlideIn, {
        open: jest.fn(() => of({
          response: true,
        })),
      }),
      mockProvider(ContainersStore, {
        selectedContainer: jest.fn(),
        containerUpdated: jest.fn(),
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
      props: { container },
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
  });

  it('renders correct values when CPU Set is not set', () => {
    spectator.setInput('container', fakeContainer({
      cpuset: null,
    }));

    const cardContent = spectator.query('mat-card-content');
    expect(cardContent).toContainText('CPU Set: All Host CPUs');
  });

  it('deletes container when "Delete" button is pressed and redirects to list root', async () => {
    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirm).toHaveBeenCalled();
    expect(spectator.inject(ApiService).call).toHaveBeenLastCalledWith('container.delete', [1]);

    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/containers']);
  });

  it('opens edit container form when Edit is pressed', async () => {
    const editButton = await loader.getHarness(MatButtonHarness.with({ text: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(ContainerFormComponent, { data: container });
    expect(spectator.inject(ContainersStore).initialize).toHaveBeenCalled();
  });

  it('does not delete container when confirmation is cancelled', async () => {
    const dialogService = spectator.inject(DialogService);
    (dialogService.confirm as jest.Mock).mockReturnValue(of(false));

    const deleteButton = await loader.getHarness(MatButtonHarness.with({ text: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('container.delete', [1]);
    expect(spectator.inject(Router).navigate).not.toHaveBeenCalled();
  });

  it('shows capabilities policy when available', () => {
    spectator.setInput('container', fakeContainer({
      capabilities_policy: 'ALLOW',
    }));

    const cardContent = spectator.query('mat-card-content');
    expect(cardContent).toContainText('Capabilities Policy: Allow');
  });
});
