import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { KeyValuePipe } from '@angular/common';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCardComponent } from '@truenas/ui-components';
import { EMPTY, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerCapabilitiesPolicy, ContainerIdmapType, ContainerStatus } from 'app/enums/container.enum';
import { ConfirmDeleteCallOptions } from 'app/interfaces/dialog.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
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
    imports: [YesNoPipe, MapValuePipe, KeyValuePipe],
    providers: [
      IxFormatterService,
      mockAuth(),
      mockProvider(ContainersStore, {
        selectedContainer: jest.fn(),
        containerUpdated: jest.fn(),
        reload: jest.fn(),
      }),
      mockApi([
        mockCall('container.delete'),
        mockCall('container.get_instance', container),
        mockCall('container.query', []),
        mockCall('container.pool_choices', { pool1: 'pool1' }),
        mockCall('lxc.config', {
          bridge: 'lxdbr0',
          v4_network: null,
          v6_network: null,
          preferred_pool: 'pool1',
        }),
      ]),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        confirmDelete: jest.fn((options: ConfirmDeleteCallOptions) => options.call()),
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
    expect(spectator.query(TnCardComponent)!.title()).toBe('General Info');
  });

  it('renders details in card', () => {
    const cardContent = spectator.query('tn-card');
    expect(cardContent).toContainText('Autostart: Yes');
    expect(cardContent).toContainText('CPU Set: 0-3');
  });

  it('renders correct values when CPU Set is not set', () => {
    spectator.setInput('container', fakeContainer({
      cpuset: null,
    }));

    const cardContent = spectator.query('tn-card');
    expect(cardContent).toContainText('CPU Set: All Host CPUs');
  });

  it('deletes container when "Delete" button is pressed and redirects to list root', async () => {
    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(DialogService).confirmDelete).toHaveBeenCalledWith({
      message: 'Delete Demo?',
      call: expect.any(Function),
    });

    expect(spectator.inject(ApiService).call).toHaveBeenCalledWith('container.delete', [1]);
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/containers']);
  });

  it('opens the edit container form side panel with the container when Edit is pressed', async () => {
    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const form = spectator.query(ContainerFormComponent, { root: true });
    expect(form).toBeInstanceOf(ContainerFormComponent);
    expect(form!.editContainer()).toEqual(container);
  });

  it('reloads containers when the edit form reports a successful save', async () => {
    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();
    spectator.detectChanges();
    await spectator.fixture.whenStable();

    const form = spectator.query(ContainerFormComponent, { root: true });
    form!.closed.emit(true);
    spectator.detectChanges();

    expect(spectator.inject(ContainersStore).reload).toHaveBeenCalled();
  });

  it('does not delete container when confirmation is cancelled', async () => {
    const dialogService = spectator.inject(DialogService);
    (dialogService.confirmDelete as jest.Mock).mockReturnValue(EMPTY);

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).call).not.toHaveBeenCalledWith('container.delete', expect.anything());
    expect(spectator.inject(Router).navigate).not.toHaveBeenCalled();
  });

  it('shows capabilities policy when available', () => {
    spectator.setInput('container', fakeContainer({
      capabilities_policy: ContainerCapabilitiesPolicy.Allow,
    }));

    const cardContent = spectator.query('tn-card');
    expect(cardContent).toContainText('Capabilities Policy: Allow All');
  });

  it('shows Default idmap type', () => {
    spectator.setInput('container', fakeContainer({
      idmap: { type: ContainerIdmapType.Default },
    }));

    const cardContent = spectator.query('tn-card');
    expect(cardContent).toContainText('ID Map Type: Default');
  });

  it('shows Isolated idmap type with slice', () => {
    spectator.setInput('container', fakeContainer({
      idmap: { type: ContainerIdmapType.Isolated, slice: 5 },
    }));

    const cardContent = spectator.query('tn-card');
    expect(cardContent).toContainText('ID Map Type: Isolated');
    expect(cardContent).toContainText('Slice: 5');
  });

  it('shows Privileged when idmap is null', () => {
    spectator.setInput('container', fakeContainer({
      idmap: null,
    }));

    const cardContent = spectator.query('tn-card');
    expect(cardContent).toContainText('ID Map Type: Privileged');
  });
});
