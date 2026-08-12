import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { KeyValuePipe } from '@angular/common';
import { Router } from '@angular/router';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnCardComponent, TnDialog } from '@truenas/ui-components';
import { of } from 'rxjs';
import { mockJob, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerCapabilitiesPolicy, ContainerIdmapType, ContainerStatus } from 'app/enums/container.enum';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SlideInResult } from 'app/modules/slide-ins/slide-in-result';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ContainerGeneralInfoComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-general-info/container-general-info.component';
import {
  DeleteContainerDialog,
} from 'app/pages/containers/components/common/delete-container-dialog/delete-container-dialog.component';
import { ContainerFormComponent } from 'app/pages/containers/components/container-form/container-form.component';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

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
      mockProvider(FormSidePanelService, {
        open: jest.fn(() => SlideInResult.success(true)),
      }),
      mockProvider(ContainersStore, {
        selectedContainer: jest.fn(),
        containerUpdated: jest.fn(),
        reload: jest.fn(),
      }),
      mockApi([
        mockJob('container.delete'),
      ]),
      mockProvider(TnDialog, {
        open: jest.fn(() => ({
          closed: of({ force: false, recursive: false }),
        })),
      }),
      mockProvider(DialogService, {
        confirm: jest.fn(() => of(true)),
        jobDialog: jest.fn(() => ({ afterClosed: () => of({}) })),
      }),
      mockProvider(SnackbarService),
      mockProvider(ErrorHandlerService, {
        withErrorHandler: jest.fn(() => (source$: unknown) => source$),
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

  it('deletes container as a job with the options from the dialog and redirects to list root', async () => {
    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(TnDialog).open).toHaveBeenCalledWith(DeleteContainerDialog, { data: container });

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
      'container.delete',
      [1, { force: false, recursive: false }],
    );
    expect(spectator.inject(SnackbarService).success).toHaveBeenCalledWith('Container deleted');
    expect(spectator.inject(Router).navigate).toHaveBeenCalledWith(['/containers']);
  });

  it('passes force and recursive on to the delete job when the dialog asks for them', async () => {
    const tnDialog = spectator.inject(TnDialog);
    (tnDialog.open as jest.Mock).mockReturnValue({ closed: of({ force: true, recursive: true }) });

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).job).toHaveBeenCalledWith(
      'container.delete',
      [1, { force: true, recursive: true }],
    );
  });

  it('opens edit container form in a side panel when Edit is pressed', async () => {
    const editButton = await loader.getHarness(TnButtonHarness.with({ label: 'Edit' }));
    await editButton.click();

    expect(spectator.inject(FormSidePanelService).open).toHaveBeenCalledWith(
      ContainerFormComponent,
      expect.objectContaining({ inputs: { editContainer: container } }),
    );
    expect(spectator.inject(ContainersStore).reload).toHaveBeenCalled();
  });

  it('does not delete container when the delete dialog is cancelled', async () => {
    const tnDialog = spectator.inject(TnDialog);
    (tnDialog.open as jest.Mock).mockReturnValue({ closed: of(false) });

    const deleteButton = await loader.getHarness(TnButtonHarness.with({ label: 'Delete' }));
    await deleteButton.click();

    expect(spectator.inject(ApiService).job).not.toHaveBeenCalled();
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
