import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { IxExplorerHarness } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AddSubsystemNamespaceComponent,
} from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem-namespaces/add-subsystem-namespace/add-subsystem-namespace.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';
import {
  mockExplorerCreateZvol, selectNamespaceType,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/testing/namespace-form.testing';
import { FilesystemService } from 'app/services/filesystem.service';

describe('AddSubsystemNamespaceComponent', () => {
  let spectator: Spectator<AddSubsystemNamespaceComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AddSubsystemNamespaceComponent,
    overrideComponents: [mockExplorerCreateZvol()],
    providers: [
      mockAuth(),
      mockProvider(FilesystemService),
      mockProvider(ApiService),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('emits the collected namespace through `closed` without calling the API', async () => {
    const closedSpy = jest.fn();
    spectator.component.closed.subscribe(closedSpy);

    await selectNamespaceType(loader, 'Existing File');
    // Controls are addressed one by one rather than through IxFormHarness: this component renders
    // no <form> element for the harness to anchor on — the panel host owns submission.
    const path = await loader.getHarness(IxExplorerHarness.with({ label: 'Path To File' }));
    await path.setValue('/mnt/dozer/file');

    spectator.component.submit();

    expect(closedSpy).toHaveBeenCalledWith({
      device_path: '/mnt/dozer/file',
      device_type: NvmeOfNamespaceType.File,
      filesize: undefined,
    } as NamespaceChanges);
    // The wizard creates namespaces itself once the subsystem is created.
    expect(spectator.inject(ApiService).call).not.toHaveBeenCalled();
  });

  it('does not emit while the form is incomplete', () => {
    const closedSpy = jest.fn();
    spectator.component.closed.subscribe(closedSpy);

    expect(spectator.component.canSubmit()).toBe(false);

    spectator.component.submit();

    expect(closedSpy).not.toHaveBeenCalled();
  });
});
