import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
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
    providers: [
      mockProvider(SlideInRef, {
        close: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('renders BaseNamespaceFormComponent', () => {
    expect(spectator.query(BaseNamespaceFormComponent)).toBeTruthy();
  });

  it('closes the slide-in when BaseNamespaceFormComponent is submitted', () => {
    const component = spectator.query(BaseNamespaceFormComponent);
    const slideInRef = spectator.inject(SlideInRef);

    const newNamespace: NamespaceChanges = {
      device_path: '/mnt/dozer/file',
      device_type: NvmeOfNamespaceType.File,
      filesize: 1024,
      enabled: true,
    };
    component.submitted.emit(newNamespace);

    expect(slideInRef.close).toHaveBeenCalledWith({
      response: newNamespace,
      error: null,
    });
  });
});
