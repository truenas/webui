import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { createRoutingFactory, SpectatorRouting, mockProvider } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { BehaviorSubject, of, Subject } from 'rxjs';
import { mockCall, mockApi } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { TreeVirtualScrollViewComponent } from 'app/modules/ix-tree/components/tree-virtual-scroll-view/tree-virtual-scroll-view.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { DatasetsManagementComponent } from 'app/pages/datasets/components/dataset-management/dataset-management.component';
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
  ] as DatasetDetails[]);

  const error$ = new BehaviorSubject<unknown>(null);

  const createComponent = createRoutingFactory({
    component: DatasetsManagementComponent,
    imports: [
      BasicSearchComponent,
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
        icon: 'app-dataset-root',
        title: 'No Datasets',
        large: true,
        button: expect.objectContaining({
          label: 'Create Pool',
        }),
      }),
    );
  });

  it('keeps the horizontal position when the page is scrolled vertically', () => {
    error$.next(null);
    datasets$.next([{ id: 'pool', name: 'pool', children: [] }] as DatasetDetails[]);
    spectator.detectChanges();
    // The tree is scrolled 162px to the right.
    Object.defineProperty(spectator.component.ixTree()!.nativeElement, 'scrollLeft', { value: 162 });
    // white-box: the sync has no observable output, so watch the subject that drives it
    const internals = spectator.component as unknown as { scrollSubject: Subject<number> };
    const sync = jest.spyOn(internals.scrollSubject, 'next');

    // `viewportScrolled` fires on the page's VERTICAL scroller and carries the CDK
    // viewport's own scrollLeft, which is always 0. Syncing to that payload dragged the
    // tree and the header back to the left edge on every vertical scroll (NAS-144025).
    spectator.query(TreeVirtualScrollViewComponent)!.viewportScrolled.emit(0);

    expect(sync).toHaveBeenCalledWith(162);
  });

  describe('horizontal scroll width', () => {
    // The tree is virtualized, so the scroll range must not be measured from the rendered
    // rows - scrolling vertically would then reset the horizontal position (NAS-144025).
    // It is reserved from the deepest level the tree currently shows instead.
    function reservedWidth(): string {
      return spectator.query<HTMLElement>('.table-container')!.style.getPropertyValue('--ix-tree-content-width');
    }

    beforeEach(() => {
      error$.next(null);
      datasets$.next([
        { id: 'pool', name: 'pool', children: [{ id: 'pool/child' }] },
        { id: 'pool/child', name: 'pool/child', children: [] },
      ] as DatasetDetails[]);
      spectator.detectChanges();
    });

    it('reserves room for the value columns only while the tree is collapsed', () => {
      expect(reservedWidth()).toBe('687px');
    });

    it('reserves one more indent once a deeper row becomes visible', () => {
      spectator.component.treeControl.expand(spectator.component.treeControl.dataNodes[0]);
      spectator.detectChanges();

      expect(reservedWidth()).toBe('727px');
    });
  });
});
