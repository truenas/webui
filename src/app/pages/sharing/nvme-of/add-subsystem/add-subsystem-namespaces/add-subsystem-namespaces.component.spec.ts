import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { signal } from '@angular/core';
import { FormControl } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { TnButtonHarness, TnIconHarness } from '@truenas/ui-components';
import { MockComponent, MockInstance } from 'ng-mocks';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import {
  AddSubsystemNamespaceComponent,
} from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem-namespaces/add-subsystem-namespace/add-subsystem-namespace.component';
import {
  AddSubsystemNamespacesComponent,
} from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem-namespaces/add-subsystem-namespaces.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';
import {
  NamespaceDescriptionComponent,
} from 'app/pages/sharing/nvme-of/namespaces/namespace-description/namespace-description.component';

describe('AddSubsystemNamespacesComponent', () => {
  let spectator: Spectator<AddSubsystemNamespacesComponent>;
  let loader: HarnessLoader;
  let formControl: FormControl<NamespaceChanges[]>;

  const newNamespace = {
    device_path: '/mnt/tank/file1',
    device_type: NvmeOfNamespaceType.File,
    filesize: 1024,
  };

  const createComponent = createComponentFactory({
    component: AddSubsystemNamespacesComponent,
    imports: [
      MockComponent(NamespaceDescriptionComponent),
      MockComponent(AddSubsystemNamespaceComponent),
    ],
  });

  beforeEach(() => {
    // The add-namespace form is mocked, so seed the signal the panel footer reads.
    MockInstance(AddSubsystemNamespaceComponent, 'canSubmit', signal(false));
    formControl = new FormControl<NamespaceChanges[]>([]);

    spectator = createComponent({
      props: {
        namespacesControl: formControl,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  afterEach(() => MockInstance.restore());

  it('shows a hint when no namespaces have been added yet', () => {
    expect(spectator.query('.empty-state')).toHaveText('Select files or zvols to expose.');
    expect(spectator.query('.namespaces-list')).not.toExist();
  });

  it('shows namespace list when namespaces are present', () => {
    const namespaces: NamespaceChanges[] = [
      {
        device_path: '/mnt/tank/file1',
        device_type: NvmeOfNamespaceType.File,
        filesize: 1024,
      },
    ];

    formControl.setValue(namespaces);
    spectator.setInput('namespacesControl', formControl);
    spectator.detectChanges();

    expect(spectator.query('.empty-state')).not.toExist();
    expect(spectator.query('.namespaces-list')).toExist();
    expect(spectator.query('ix-namespace-description')).toExist();
  });

  it('opens the Add Namespace side panel and adds the namespace when the form saves', async () => {
    const addButton = await loader.getHarness(TnButtonHarness.with({ label: 'Add' }));
    await addButton.click();

    expect(spectator.component.namespacePanelOpen()).toBe(true);

    spectator.component.onNamespaceSaved(newNamespace);
    spectator.detectChanges();

    expect(spectator.component.namespacePanelOpen()).toBe(false);
    expect(formControl.value).toEqual([newNamespace]);
    expect(spectator.query('.empty-state')).not.toExist();
    expect(spectator.query('.namespaces-list')).toExist();
  });

  it('removes a namespace from the list when clear icon is pressed', async () => {
    const namespaces: NamespaceChanges[] = [
      {
        device_path: '/mnt/tank/file1',
        device_type: NvmeOfNamespaceType.File,
        filesize: 1024,
      },
      {
        device_path: '/mnt/tank/file2',
        device_type: NvmeOfNamespaceType.File,
        filesize: 2048,
      },
    ];

    formControl.setValue(namespaces);
    spectator.setInput('namespacesControl', formControl);
    spectator.detectChanges();

    const deleteButtons = await loader.getAllHarnesses(TnIconHarness.with({ name: 'close' }));
    expect(deleteButtons).toHaveLength(2);

    await deleteButtons[0].click();

    expect(formControl.value).toEqual([namespaces[1]]);
  });

  it('prevents duplicate namespaces from being added', () => {
    spectator.component.onNamespaceSaved(newNamespace);
    // Save the same namespace again
    spectator.component.onNamespaceSaved(newNamespace);

    expect(formControl.value).toEqual([newNamespace]);
  });
});
