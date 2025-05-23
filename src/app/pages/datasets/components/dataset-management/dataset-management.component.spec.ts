import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { createRoutingFactory, SpectatorRouting, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { BehaviorSubject, of } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { TreeVirtualScrollViewComponent } from 'app/modules/ix-tree/components/tree-virtual-scroll-view/tree-virtual-scroll-view.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { DatasetsManagementComponent } from 'app/pages/datasets/components/dataset-management/dataset-management.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
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
      SearchInput1Component,
      MockComponent(EmptyComponent),
      FakeProgressBarComponent,
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

  it('checks if tree node component is rendered', () => {
    expect(spectator.query(TreeVirtualScrollViewComponent)).toBeTruthy();
  });

  it('should display error when datasets loading fails', () => {
    error$.next(new ApiCallError({
      data: {
        reason: 'Network Error',
      },
    } as JsonRpcError));
    datasets$.next([]);

    spectator.detectChanges();

    expect(spectator.query(EmptyComponent)!.conf).toEqual(
      expect.objectContaining({
        large: true,
        type: 'errors',
        title: 'Failed to load datasets',
        message: 'Network Error',
        button: expect.objectContaining({
          label: 'Retry',
        }),
      }),
    );
  });

  it('should display empty state when no datasets', () => {
    error$.next(null);
    datasets$.next([]);
    spectator.detectChanges();

    expect(spectator.query(EmptyComponent)!.conf).toEqual(
      expect.objectContaining({
        type: 'no_page_data',
        icon: 'ix-dataset-root',
        title: 'No Datasets',
        large: true,
        button: expect.objectContaining({
          label: 'Create Pool',
        }),
      }),
    );
  });
});
