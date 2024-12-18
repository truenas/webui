import { Component, ChangeDetectionStrategy } from '@angular/core';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { VirtualizationInstance } from 'app/interfaces/virtualization.interface';
import { AllInstancesHeaderComponent } from 'app/pages/virtualization/components/all-instances/all-instances-header/all-instances-header.component';
import { AllInstancesComponent } from 'app/pages/virtualization/components/all-instances/all-instances.component';
import { InstanceDetailsComponent } from 'app/pages/virtualization/components/all-instances/instance-details/instance-details.component';
import { InstanceListComponent } from 'app/pages/virtualization/components/all-instances/instance-list/instance-list.component';
import { VirtualizationConfigStore } from 'app/pages/virtualization/stores/virtualization-config.store';
import { VirtualizationDevicesStore } from 'app/pages/virtualization/stores/virtualization-devices.store';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';
import { selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  selector: 'ix-master-detail-view',
  exportAs: 'masterDetailViewContext',
  template: '<ng-content></ng-content>',
})
class MockMasterDetailViewComponent {
  isMobileView = jest.fn(() => false);
  showMobileDetails = jest.fn(() => false);
  toggleShowMobileDetails = jest.fn();
}

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
