import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { WINDOW } from 'app/helpers/window.helper';
import { ContainerInstance } from 'app/interfaces/container.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { MockMasterDetailViewComponent } from 'app/modules/master-detail-view/testing/mock-master-detail-view.component';
import { AllContainersHeaderComponent } from 'app/pages/containers/components/all-containers/all-containers-header/all-containers-header.component';
import { AllContainersComponent } from 'app/pages/containers/components/all-containers/all-containers.component';
import { ContainerDetailsComponent } from 'app/pages/containers/components/all-containers/container-details/container-details.component';
import { ContainerConfigStore } from 'app/pages/containers/stores/container-config.store';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';
import { selectAdvancedConfig, selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('AllContainersComponent', () => {
  let spectator: Spectator<AllContainersComponent>;
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
  };

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
      mockProvider(DialogService, {
        warn: jest.fn(() => of(true)),
      }),
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
        containers: jest.fn(() => [] as ContainerInstance[]),
        isLoading: jest.fn(() => false),
      }),
      {
        provide: WINDOW,
        useValue: {
          localStorage: mockLocalStorage,
          document: {
            querySelector: jest.fn(),
          },
          addEventListener: jest.fn(),
        },
      },
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    jest.clearAllMocks();
  });

  it('initializes config store on init', () => {
    spectator.component.ngOnInit();
    expect(spectator.inject(ContainerConfigStore).initialize).toHaveBeenCalled();
    expect(spectator.inject(ContainersStore).initialize).toHaveBeenCalled();
  });

  it('shows warning dialog and updates localStorage if warning has not been shown before', () => {
    mockLocalStorage.getItem.mockReturnValue(null);

    spectator.component.ngOnInit();

    const dialogService = spectator.inject(DialogService);

    expect(dialogService.warn).toHaveBeenCalledTimes(1);
    expect(dialogService.warn).toHaveBeenCalledWith(
      'Warning',
      'Containers are experimental and only recommended for advanced users. Make all configuration changes using the TrueNAS UI. Operations using the command line are not supported.',
    );
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('showNewVmInstancesWarning', 'true');
  });

  it('does not show warning dialog if it has been shown before', () => {
    mockLocalStorage.getItem.mockReturnValue('true');

    spectator.component.ngOnInit();

    const dialogService = spectator.inject(DialogService);
    expect(dialogService.warn).not.toHaveBeenCalled();
  });
});
