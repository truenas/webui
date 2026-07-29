import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import {
  AddSubsystemNamespaceComponent,
} from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem-namespaces/add-subsystem-namespace/add-subsystem-namespace.component';
import {
  BaseNamespaceFormComponent,
} from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/base-namespace-form.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';

describe('AddSubsystemNamespaceComponent', () => {
  let spectator: Spectator<AddSubsystemNamespaceComponent>;
  const createComponent = createComponentFactory({
    component: AddSubsystemNamespaceComponent,
    imports: [
      MockComponent(BaseNamespaceFormComponent),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('renders BaseNamespaceFormComponent', () => {
    expect(spectator.query(BaseNamespaceFormComponent)).toBeTruthy();
  });

  it('emits the new namespace through `closed` when BaseNamespaceFormComponent is submitted', () => {
    const emitSpy = jest.fn();
    spectator.component.closed.subscribe(emitSpy);

    const newNamespace: NamespaceChanges = {
      device_path: '/mnt/dozer/file',
      device_type: NvmeOfNamespaceType.File,
      filesize: 1024,
    };
    spectator.query(BaseNamespaceFormComponent).submitted.emit(newNamespace);

    expect(emitSpy).toHaveBeenCalledWith(newNamespace);
  });
});
