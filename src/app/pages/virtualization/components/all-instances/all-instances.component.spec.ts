import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { MockComponents } from 'ng-mocks';
import {
  AllInstancesHeaderComponent,
} from 'app/pages/virtualization/components/all-instances/all-instances-header/all-instances-header.component';
import { AllInstancesComponent } from 'app/pages/virtualization/components/all-instances/all-instances.component';
import {
  InstanceDetailsComponent,
} from 'app/pages/virtualization/components/all-instances/instance-details/instance-details.component';
import { VirtualizationConfigStore } from 'app/pages/virtualization/stores/virtualization-config.store';
import { VirtualizationInstancesStore } from 'app/pages/virtualization/stores/virtualization-instances.store';

describe('AllInstancesComponent', () => {
  let spectator: Spectator<AllInstancesComponent>;
  const createComponent = createComponentFactory({
    component: AllInstancesComponent,
    providers: [
      mockProvider(VirtualizationConfigStore, {
        initialize: jest.fn(),
      }),
      mockProvider(VirtualizationInstancesStore, {
        initialize: jest.fn(),
        selectedInstance: jest.fn(),
      }),
    ],
    declarations: [
      MockComponents(
        AllInstancesHeaderComponent,
        InstanceDetailsComponent,
      ),
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
