import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { createRoutingFactory, SpectatorRouting, mockProvider } from '@ngneat/spectator/jest';
import { TnEmptyComponent, TnTreeVirtualScrollViewComponent } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { DatasetsManagementComponent } from 'app/pages/datasets/components/dataset-management/dataset-management.component';
import { DatasetNodeComponent } from 'app/pages/datasets/components/dataset-node/dataset-node.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { SharingTierService } from 'app/pages/sharing/components/sharing-tier.service';
import { ApiCallError } from 'app/services/errors/error.classes';

describe('DatasetsManagementComponent', () => {
  let spectator: SpectatorRouting<DatasetsManagementComponent>;
  let router: Router;
  let location: Location;

  const datasets$ = new BehaviorSubject([
    { id: 'first', name: 'First Dataset' },
    { id: 'second', name: 'Second Dataset' },
  ]);

  const error$ = new BehaviorSubject<unknown>(null);

  const createComponent = createRoutingFactory({
    component: DatasetsManagementComponent,
    imports: [
      BasicSearchComponent,
      FakeProgressBarComponent,
    ],
    overrideComponents: [
      [
        DatasetsManagementComponent,
        {
          remove: { imports: [DatasetNodeComponent] },
          add: { imports: [MockComponent(DatasetNodeComponent)] },
        },
      ],
    ],
    providers: [
      mockAuth(),
      mockApi([
        mockCall('systemdataset.config', { pool: 'Second Dataset' } as SystemDatasetConfig),
      ]),
      mockProvider(DatasetTreeStore, {
        datasets$,
        error$,
        loadDatasets: () => {},
        selectedBranch$: of(false),
        isLoading$: of(false),
        selectDatasetById: () => {},
      }),
      mockProvider(SharingTierService, {
        getTierConfig: () => of({ enabled: false }),
        tierEnabled: () => false,
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    router = spectator.inject(Router);
    location = spectator.inject(Location);
  });

  it('should automatically navigate to the first dataset on init', () => {
    spectator.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/datasets', 'first'], { replaceUrl: true });
  });

  it('should navigate back to the previous route when back button is clicked', async () => {
    await router.navigate(['/previous-route']);
    await router.navigate(['/datasets']);

    spectator.detectChanges();

    expect(router.navigate).toHaveBeenCalledWith(['/datasets', 'first'], { replaceUrl: true });

    location.back();

    expect(router.navigate).toHaveBeenCalledWith(['/previous-route']);
  });

  it('checks if the dataset tree is rendered', () => {
    expect(spectator.query(TnTreeVirtualScrollViewComponent)).toBeTruthy();
  });

  it('should display error when datasets loading fails', () => {
    error$.next(new ApiCallError({
      data: {
        reason: 'Network Error',
      },
    } as JsonRpcError));
    datasets$.next([]);

    spectator.detectChanges();

    const empty = spectator.query(TnEmptyComponent);
    expect(empty).toBeTruthy();
    expect(empty!.title()).toBe('Failed to load datasets');
    expect(empty!.description()).toBe('Network Error');
    expect(empty!.icon()).toBe('alert-octagon');
    expect(empty!.actionText()).toBe('Retry');
  });

  it('should display empty state when no datasets', () => {
    error$.next(null);
    datasets$.next([]);
    spectator.detectChanges();

    const empty = spectator.query(TnEmptyComponent);
    expect(empty).toBeTruthy();
    expect(empty!.title()).toBe('No Datasets');
    expect(empty!.icon()).toBe('dataset-root');
    expect(empty!.actionText()).toBe('Create Pool');
  });
});
