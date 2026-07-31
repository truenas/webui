import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { createComponentFactory, Spectator, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import {
  ExplorerCreateZvolComponent,
} from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-zvol/explorer-create-zvol.component';
import { IxFormHarness } from 'app/modules/forms/ix-forms/testing/ix-form.harness';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  AddSubsystemNamespaceComponent,
} from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem-namespaces/add-subsystem-namespace/add-subsystem-namespace.component';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';
import {
  selectNamespaceType,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-form.testing';
import { FilesystemService } from 'app/services/filesystem.service';

describe('AddSubsystemNamespaceComponent', () => {
  let spectator: Spectator<AddSubsystemNamespaceComponent>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: AddSubsystemNamespaceComponent,
    overrideComponents: [
      // BaseNamespaceFormComponent is standalone, so its own `imports` define the template scope —
      // listing a mock in the TestBed module would NOT replace the real child. Override the
      // component's own import array instead, or the real explorer button renders (pulling in the
      // real FormSidePanelService) while the spec reads as though it were stubbed.
      [BaseNamespaceFormComponent, {
        remove: { imports: [ExplorerCreateZvolComponent] },
        add: { imports: [MockComponent(ExplorerCreateZvolComponent)] },
      }],
    ],
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
    const form = await loader.getHarness(IxFormHarness);
    await form.fillForm({
      'Path To File': '/mnt/dozer/file',
    });

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
