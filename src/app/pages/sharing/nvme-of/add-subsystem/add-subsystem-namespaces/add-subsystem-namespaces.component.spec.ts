import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { FormControl } from '@angular/forms';
import { MatButtonHarness } from '@angular/material/button/testing';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { of } from 'rxjs';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { IxIconHarness } from 'app/modules/ix-icon/ix-icon.harness';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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
    enabled: true,
  };

  const createComponent = createComponentFactory({
    component: AddSubsystemNamespacesComponent,
    imports: [
      MockComponent(NamespaceDescriptionComponent),
    ],
    providers: [
      mockProvider(SlideIn, {
        open: jest.fn(() => of({ response: newNamespace, error: null as string | null })),
      }),
    ],
  });

  beforeEach(() => {
    formControl = new FormControl<NamespaceChanges[]>([]);

    spectator = createComponent({
      props: {
        namespacesControl: formControl,
      },
    });

    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

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
        enabled: true,
      },
    ];

    formControl.setValue(namespaces);
    spectator.setInput('namespacesControl', formControl);
    spectator.detectChanges();

    expect(spectator.query('.empty-state')).not.toExist();
    expect(spectator.query('.namespaces-list')).toExist();
    expect(spectator.query('ix-namespace-description')).toExist();
  });

  it('opens AddSubsystemNamespaceComponent and adds new namespace to the list when it closes', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();
    spectator.detectChanges();

    expect(spectator.inject(SlideIn).open).toHaveBeenCalledWith(AddSubsystemNamespaceComponent);

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
        enabled: true,
      },
      {
        device_path: '/mnt/tank/file2',
        device_type: NvmeOfNamespaceType.File,
        filesize: 2048,
        enabled: true,
      },
    ];

    formControl.setValue(namespaces);
    spectator.setInput('namespacesControl', formControl);
    spectator.detectChanges();

    const deleteButtons = await loader.getAllHarnesses(IxIconHarness.with({ name: 'clear' }));
    expect(deleteButtons).toHaveLength(2);

    await deleteButtons[0].click();

    expect(formControl.value).toEqual([namespaces[1]]);
  });

  it('prevents duplicate namespaces from being added', async () => {
    const addButton = await loader.getHarness(MatButtonHarness.with({ text: 'Add' }));
    await addButton.click();
    spectator.detectChanges();

    // Try to add the same namespace again
    await addButton.click();
    spectator.detectChanges();

    expect(formControl.value).toEqual([newNamespace]);
  });
});
