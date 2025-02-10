import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { MockMasterDetailViewComponent } from 'app/modules/master-detail-view/testing/mock-master-detail-view.component';
import { AllInstancesHeaderComponent } from 'app/pages/instances/components/all-instances/all-instances-header/all-instances-header.component';
import { AllInstancesComponent } from 'app/pages/instances/components/all-instances/all-instances.component';
import { InstanceDetailsComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-details.component';
import { InstanceListComponent } from 'app/pages/instances/components/all-instances/instance-list/instance-list.component';
import { VirtualizationConfigStore } from 'app/pages/instances/stores/virtualization-config.store';
import { VirtualizationDevicesStore } from 'app/pages/instances/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('AllInstancesComponent', () => {
  let spectator: Spectator<AllInstancesComponent>;
  const createComponent = createComponentFactory({
    component: AllInstancesComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponents(
        MockMasterDetailViewComponent,
        AllInstancesHeaderComponent,
        InstanceDetailsComponent,
        InstanceListComponent,
      ),
    ],
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectSystemConfigState,
            value: {},
          },
        ],
      }),
      mockAuth(),
      mockProvider(VirtualizationConfigStore, {
        initialize: jest.fn(),
      }),
      mockProvider(VirtualizationInstancesStore, {
        initialize: jest.fn(),
      }),
      mockProvider(VirtualizationDevicesStore, {
        selectedInstance: jest.fn(() => ({ id: 'instance1' } as VirtualizationInstance)),
        resetInstance: jest.fn(),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('initializes config store on init', () => {
    expect(spectator.inject(VirtualizationConfigStore).initialize).toHaveBeenCalled();
    expect(spectator.inject(VirtualizationInstancesStore).initialize).toHaveBeenCalled();
  });
});
