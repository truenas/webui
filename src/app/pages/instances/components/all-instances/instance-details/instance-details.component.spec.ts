import { Type } from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import {
  InstanceDetailsComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-details.component';
import {
  InstanceDisksComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-disks/instance-disks.component';
import {
  InstanceGeneralInfoComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-general-info/instance-general-info.component';
import {
  InstanceNicsComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-nics/instance-nics.component';
import {
  InstanceToolsComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-tools/instance-tools.component';
import {
  InstanceUsbDevicesComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-usb-devices/instance-usb-devices.component';
import { fakeVirtualizationInstance } from 'app/pages/instances/utils/fake-virtualization-instance.utils';

describe('InstanceDetailsComponent', () => {
  let spectator: Spectator<InstanceDetailsComponent>;
  const createComponent = createComponentFactory({
    component: InstanceDetailsComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponents(
        InstanceGeneralInfoComponent,
        InstanceUsbDevicesComponent,
        InstanceDisksComponent,
        InstanceNicsComponent,
        InstanceToolsComponent,
      ),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        instance: fakeVirtualizationInstance({
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
      InstanceDisksComponent,
      InstanceNicsComponent,
      InstanceToolsComponent,
    ];

    expectedComponents.forEach((component) => {
      expect(spectator.query(component as Type<unknown>)).toExist();
    });
  });
});
