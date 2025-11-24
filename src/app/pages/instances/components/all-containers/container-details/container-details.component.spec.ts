import { Type } from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import {
  ContainerDetailsComponent,
} from 'app/pages/instances/components/all-containers/container-details/container-details.component';
import {
  ContainerFilesystemDevicesComponent,
} from 'app/pages/instances/components/all-containers/container-details/container-filesystem-devices/container-filesystem-devices.component';
import {
  ContainerGeneralInfoComponent,
} from 'app/pages/instances/components/all-containers/container-details/container-general-info/container-general-info.component';
import {
  ContainerNicDevicesComponent,
} from 'app/pages/instances/components/all-containers/container-details/container-nic-devices/container-nic-devices.component';
import {
  ContainerToolsComponent,
} from 'app/pages/instances/components/all-containers/container-details/container-tools/container-tools.component';
import {
  ContainerUsbDevicesComponent,
} from 'app/pages/instances/components/all-containers/container-details/container-usb-devices/container-usb-devices.component';
import { fakeContainerInstance } from 'app/pages/instances/utils/fake-container-instance.utils';

describe('ContainerDetailsComponent', () => {
  let spectator: Spectator<ContainerDetailsComponent>;
  const createComponent = createComponentFactory({
    component: ContainerDetailsComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponents(
        ContainerGeneralInfoComponent,
        ContainerUsbDevicesComponent,
        ContainerFilesystemDevicesComponent,
        ContainerNicDevicesComponent,
        ContainerToolsComponent,
      ),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        instance: fakeContainerInstance({
          id: 1,
          name: 'my-instance',
        }),
      },
    });
  });

  it('shows details sub-components related to a selected container', () => {
    const expectedComponents = [
      ContainerGeneralInfoComponent,
      ContainerUsbDevicesComponent,
      ContainerFilesystemDevicesComponent,
      ContainerNicDevicesComponent,
      ContainerToolsComponent,
    ];

    expectedComponents.forEach((component) => {
      expect(spectator.query(component as Type<unknown>)).toExist();
    });
  });
});
