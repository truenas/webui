import { Type } from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import {
  InstanceDetailsComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-details.component';
import {
  InstanceFilesystemDevicesComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-filesystem-devices/instance-filesystem-devices.component';
import {
  InstanceGeneralInfoComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-general-info/instance-general-info.component';
import {
  InstanceNicDevicesComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-nic-devices/instance-nic-devices.component';
import {
  InstanceToolsComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-tools/instance-tools.component';
import {
  InstanceUsbDevicesComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-usb-devices/instance-usb-devices.component';
import { fakeContainerInstance } from 'app/pages/instances/utils/fake-container-instance.utils';

describe('InstanceDetailsComponent', () => {
  let spectator: Spectator<InstanceDetailsComponent>;
  const createComponent = createComponentFactory({
    component: InstanceDetailsComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponents(
        InstanceGeneralInfoComponent,
        InstanceUsbDevicesComponent,
        InstanceFilesystemDevicesComponent,
        InstanceNicDevicesComponent,
        InstanceToolsComponent,
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
      InstanceGeneralInfoComponent,
      InstanceUsbDevicesComponent,
      InstanceFilesystemDevicesComponent,
      InstanceNicDevicesComponent,
      InstanceToolsComponent,
    ];

    expectedComponents.forEach((component) => {
      expect(spectator.query(component as Type<unknown>)).toExist();
    });
  });
});
