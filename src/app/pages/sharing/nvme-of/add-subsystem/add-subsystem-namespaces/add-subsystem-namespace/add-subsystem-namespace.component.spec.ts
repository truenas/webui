import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { firstValueFrom } from 'rxjs';
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
      mockProvider(SlideInRef),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('renders BaseNamespaceFormComponent and wires submitHandler + suppressSuccessSnackbar', () => {
    const baseForm = spectator.query(BaseNamespaceFormComponent);
    expect(baseForm).toBeTruthy();
    expect(baseForm.submitHandler).toBeDefined();
    expect(baseForm.suppressSuccessSnackbar).toBe(true);
  });

  it('passes the NamespaceChanges through as-is so the wrapper closes with that payload', async () => {
    const newNamespace: NamespaceChanges = {
      device_path: '/mnt/dozer/file',
      device_type: NvmeOfNamespaceType.File,
      filesize: 1024,
    };

    const result = spectator.component.handleSubmit(newNamespace);
    // The wrapper subscribes to request$ on submit; emitted value is what
    // it then closes the slide-in with (no closeWith override).
    await expect(firstValueFrom(result.request$)).resolves.toEqual(newNamespace);
    expect(result.successMessage).toBe('');
  });
});
