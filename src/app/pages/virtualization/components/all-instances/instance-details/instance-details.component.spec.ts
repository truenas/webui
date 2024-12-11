import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import {
  InstanceDetailsComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-details.component';
import {
  InstanceDevicesComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-devices/instance-devices.component';
import {
  InstanceDisksComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-disks/instance-disks.component';
import {
  InstanceGeneralInfoComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-general-info/instance-general-info.component';
import { InstanceNicsComponent } from 'app/pages/virtualization/components/all-instances/instance-details/instance-nics/instance-nics.component';
import {
  InstanceProxiesComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-proxies/instance-proxies.component';

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
        InstanceProxiesComponent,
        InstanceNicsComponent,
      ),
    ],
  });

  beforeEach(() => {
    spectator = createComponent({
      props: {
        instance: {
          name: 'my-instance',
        } as VirtualizationInstance,
      },
    });
  });

  it('shows details sub-components related to selected instance', () => {
    expect(spectator.query(InstanceGeneralInfoComponent)).toExist();
    expect(spectator.query(InstanceDevicesComponent)).toExist();
    expect(spectator.query(InstanceDisksComponent)).toExist();
    expect(spectator.query(InstanceNicsComponent)).toExist();
    expect(spectator.query(InstanceProxiesComponent)).toExist();
  });
});
