import { Type } from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import {
  ContainerDetailsComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-details.component';
import {
  ContainerFilesystemDevicesComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-filesystem-devices/container-filesystem-devices.component';
import {
  ContainerGeneralInfoComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-general-info/container-general-info.component';
import {
  ContainerGpuDevicesComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-gpu-devices/container-gpu-devices.component';
import {
  ContainerNicDevicesComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-nic-devices/container-nic-devices.component';
import {
  ContainerToolsComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-tools/container-tools.component';
import {
  ContainerUsbDevicesComponent,
} from 'app/pages/containers/components/all-containers/container-details/container-usb-devices/container-usb-devices.component';
import { fakeContainer } from 'app/pages/containers/utils/fake-container.utils';

describe('ContainerDetailsComponent', () => {
  let spectator: Spectator<ContainerDetailsComponent>;
  const createComponent = createComponentFactory({
    component: ContainerDetailsComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponents(
        ContainerGeneralInfoComponent,
        ContainerUsbDevicesComponent,
        ContainerGpuDevicesComponent,
        ContainerFilesystemDevicesComponent,
        ContainerNicDevicesComponent,
        ContainerToolsComponent,
      ),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        container: fakeContainer({
          id: 1,
          name: 'my-container',
        }),
      },
    });
  });

  it('shows details sub-components related to a selected container', () => {
    const expectedComponents = [
      ContainerGeneralInfoComponent,
      ContainerUsbDevicesComponent,
      ContainerGpuDevicesComponent,
      ContainerFilesystemDevicesComponent,
      ContainerNicDevicesComponent,
      ContainerToolsComponent,
    ];

    expectedComponents.forEach((component) => {
      expect(spectator.query(component as Type<unknown>)).toExist();
    });
  });
});
