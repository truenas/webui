import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { NvmeOfNamespaceType } from 'app/enums/nvme-of.enum';
import { NvmeOfNamespace } from 'app/interfaces/nvme-of.interface';
import {
  NamespaceDescriptionComponent,
} from 'app/pages/sharing/nvme-of/namespaces/namespace-description/namespace-description.component';

describe('NamespaceDescriptionComponent', () => {
  let spectator: Spectator<NamespaceDescriptionComponent>;
  const createComponent = createComponentFactory({
    component: NamespaceDescriptionComponent,
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        namespace: {
          device_type: NvmeOfNamespaceType.File,
          device_path: '/mnt/dozer/myfile',
          enabled: true,
        } as NvmeOfNamespace,
      },
    });
  });

  it('shows namespace description', () => {
    expect(spectator.fixture.nativeElement).toHaveText('File — /mnt/dozer/myfile');
  });
});
