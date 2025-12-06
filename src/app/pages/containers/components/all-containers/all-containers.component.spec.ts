import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { Container } from 'app/interfaces/container.interface';
import { MockMasterDetailViewComponent } from 'app/modules/master-detail-view/testing/mock-master-detail-view.component';
import { AllContainersHeaderComponent } from 'app/pages/containers/components/all-containers/all-containers-header/all-containers-header.component';
import { AllContainersComponent } from 'app/pages/containers/components/all-containers/all-containers.component';
import { ContainerDetailsComponent } from 'app/pages/containers/components/all-containers/container-details/container-details.component';
import { ContainerConfigStore } from 'app/pages/containers/stores/container-config.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { selectAdvancedConfig, selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('AllContainersComponent', () => {
  let spectator: Spectator<AllContainersComponent>;

  const createComponent = createComponentFactory({
    component: AllContainersComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponents(
        MockMasterDetailViewComponent,
        AllContainersHeaderComponent,
        ContainerDetailsComponent,
      ),
    ],
    providers: [
      provideMockStore({
        selectors: [
          {
            selector: selectSystemConfigState,
            value: {},
          },
          {
            selector: selectAdvancedConfig,
            value: {},
          },
        ],
      }),
      mockAuth(),
      mockProvider(ContainerConfigStore, {
        initialize: jest.fn(),
        config: () => ({
          bridge: null as string | null,
          v4_network: null as string | null,
          v6_network: null as string | null,
          preferred_pool: null as string | null,
        }),
      }),
      mockProvider(ContainersStore, {
        selectedContainer: jest.fn(() => ({})),
        initialize: jest.fn(),
        containers: jest.fn(() => [] as Container[]),
        isLoading: jest.fn(() => false),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('initializes config store on init', () => {
    spectator.component.ngOnInit();
    expect(spectator.inject(ContainerConfigStore).initialize).toHaveBeenCalled();
    expect(spectator.inject(ContainersStore).initialize).toHaveBeenCalled();
  });
});
