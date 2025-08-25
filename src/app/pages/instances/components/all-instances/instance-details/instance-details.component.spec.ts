import { Type } from '@angular/core';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { VirtualizationType } from 'app/enums/virtualization.enum';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import {
  InstanceDetailsComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-details.component';
import {
  InstanceDevicesComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-devices/instance-devices.component';
import {
  InstanceDisksComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-disks/instance-disks.component';
import {
  InstanceGeneralInfoComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-general-info/instance-general-info.component';
import {
  InstanceIdmapComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-idmap/instance-idmap.component';
import {
  InstanceNicsComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-nics/instance-nics.component';
import {
  InstanceProxiesComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-proxies/instance-proxies.component';
import {
  InstanceToolsComponent,
} from 'app/pages/instances/components/all-instances/instance-details/instance-tools/instance-tools.component';

describe('InstanceDetailsComponent', () => {
  let spectator: Spectator<InstanceDetailsComponent>;
  const createComponent = createComponentFactory({
    component: InstanceDetailsComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponents(
        InstanceGeneralInfoComponent,
        InstanceDevicesComponent,
        InstanceDisksComponent,
        InstanceNicsComponent,
        InstanceProxiesComponent,
        InstanceIdmapComponent,
        InstanceToolsComponent,
      ),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        instance: {
          name: 'my-instance',
          type: VirtualizationType.Container,
        } as VirtualizationInstance,
      },
    });
  });

  it('shows details sub-components related to a selected container', () => {
    spectator.setInput('instance', {
      name: 'my-instance',
      type: VirtualizationType.Container,
    } as VirtualizationInstance);

    const expectedComponents = [
      InstanceGeneralInfoComponent,
      InstanceDevicesComponent,
      InstanceDisksComponent,
      InstanceNicsComponent,
      InstanceToolsComponent,
      InstanceProxiesComponent,
      InstanceIdmapComponent,
    ];

    expectedComponents.forEach((component) => {
      expect(spectator.query(component as Type<unknown>)).toExist();
    });
  });
});
