import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { provideMockStore } from '@ngrx/store/testing';
import { MockComponents } from 'ng-mocks';
import { NgxSkeletonLoaderComponent } from 'ngx-skeleton-loader';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { ContainerGlobalState } from 'app/enums/container.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { ContainerInstance } from 'app/interfaces/container.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { MockMasterDetailViewComponent } from 'app/modules/master-detail-view/testing/mock-master-detail-view.component';
import { AllInstancesHeaderComponent } from 'app/pages/instances/components/all-instances/all-instances-header/all-instances-header.component';
import { AllInstancesComponent } from 'app/pages/instances/components/all-instances/all-instances.component';
import { InstanceDetailsComponent } from 'app/pages/instances/components/all-instances/instance-details/instance-details.component';
import { VirtualizationConfigStore } from 'app/pages/instances/stores/virtualization-config.store';
import { VirtualizationInstancesStore } from 'app/pages/instances/stores/virtualization-instances.store';
import { selectAdvancedConfig, selectSystemConfigState } from 'app/store/system-config/system-config.selectors';

describe('AllInstancesComponent', () => {
  let spectator: Spectator<AllInstancesComponent>;
  const mockLocalStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
  };

  const createComponent = createComponentFactory({
    component: AllInstancesComponent,
    imports: [
      NgxSkeletonLoaderComponent,
      MockComponents(
        MockMasterDetailViewComponent,
        AllInstancesHeaderComponent,
        InstanceDetailsComponent,
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
      mockProvider(VirtualizationConfigStore, {
        initialize: jest.fn(),
        state$: of({ config: { state: ContainerGlobalState.Initialized } }),
      }),
      mockProvider(VirtualizationInstancesStore, {
        selectedInstance: jest.fn(() => ({})),
        initialize: jest.fn(),
        instances: jest.fn(() => [] as ContainerInstance[]),
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
    expect(spectator.inject(VirtualizationConfigStore).initialize).toHaveBeenCalled();
    expect(spectator.inject(VirtualizationInstancesStore).initialize).toHaveBeenCalled();
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
