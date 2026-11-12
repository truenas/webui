import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Location } from '@angular/common';
import { signal } from '@angular/core';
import { Router } from '@angular/router';
import { createRoutingFactory, SpectatorRouting, mockProvider } from '@ngneat/spectator/jest';
import { CallResponse } from '@truenas/api-client';
import { TnEmptyComponent, TnEmptyHarness, TnTreeVirtualScrollViewComponent } from '@truenas/ui-components';
import { MockComponent } from 'ng-mocks';
import { Subject } from 'rxjs';
import { mockApi, mockCall } from 'app/core/testing/utils/mock-api.utils';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { JsonRpcError } from 'app/interfaces/api-message.interface';
import { DatasetDetails } from 'app/interfaces/dataset.interface';
import { ZfsTierRewriteJobEntry } from 'app/interfaces/zfs-tier.interface';
import { BasicSearchComponent } from 'app/modules/forms/search-input/components/basic-search/basic-search.component';
import { BasicSearchHarness } from 'app/modules/forms/search-input/components/basic-search/basic-search.harness';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { WebUiApiDirectory } from 'app/modules/websocket/typed-api/typed-api-client.token';
import { DatasetsManagementComponent } from 'app/pages/datasets/components/dataset-management/dataset-management.component';
import { DatasetNodeComponent } from 'app/pages/datasets/components/dataset-node/dataset-node.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';
import { mockSharingTierService } from 'app/pages/sharing/components/testing/mock-sharing-tier.utils';
import { ApiCallError } from 'app/services/errors/error.classes';

describe('DatasetsManagementComponent', () => {
  let spectator: SpectatorRouting<DatasetsManagementComponent>;
  let loader: HarnessLoader;
  let router: Router;
  let location: Location;

  const initialDatasets = [
    { id: 'first', name: 'First Dataset' },
    { id: 'second', name: 'Second Dataset' },
  ] as DatasetDetails[];
  const datasets = signal(initialDatasets);
  const error = signal<unknown>(null);
  const selectedBranch = signal<DatasetDetails[] | null>(null);
  const tierJobUpdates$ = new Subject<ZfsTierRewriteJobEntry>();

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
        mockCall('systemdataset.config', { pool: 'Second Dataset' } as CallResponse<WebUiApiDirectory, 'systemdataset.config'>),
      ]),
      mockProvider(DatasetTreeStore, {
        datasets,
        error,
        loadDatasets: jest.fn(),
        refreshDatasets: jest.fn(),
        selectedBranch,
        selectedDataset: signal(null),
        isLoading: signal(false),
        selectDatasetById: () => {},
      }),
      mockSharingTierService({ jobUpdates$: tierJobUpdates$ }),
    ],
  });

  beforeEach(() => {
    datasets.set(initialDatasets);
    error.set(null);
    selectedBranch.set(null);
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
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

  it('should display error when datasets loading fails', async () => {
    error.set(new ApiCallError({
      data: {
        reason: 'Network Error',
      },
    } as JsonRpcError));
    datasets.set([]);

    spectator.detectChanges();

    const empty = await loader.getHarness(TnEmptyHarness);
    expect(await empty.getTitle()).toBe('Failed to load datasets');
    expect(await empty.getDescription()).toBe('Network Error');
    // white-box: TnEmptyHarness has no getter for icon / action text
    expect(spectator.query(TnEmptyComponent)!.icon()).toBe('alert-octagon');
    expect(spectator.query(TnEmptyComponent)!.actionText()).toBe('Retry');
  });

  it('should display empty state when no datasets', async () => {
    error.set(null);
    datasets.set([]);
    spectator.detectChanges();

    const empty = await loader.getHarness(TnEmptyHarness);
    expect(await empty.getTitle()).toBe('No Datasets');
    // white-box: TnEmptyHarness has no getter for icon / action text
    expect(spectator.query(TnEmptyComponent)!.icon()).toBe('dataset-root');
    expect(spectator.query(TnEmptyComponent)!.actionText()).toBe('Create Pool');
  });

  it('refreshes the datasets in the background when a tier job appears or changes status', () => {
    const store = spectator.inject(DatasetTreeStore);

    tierJobUpdates$.next({ tier_job_id: 'pool/dataset@1' } as ZfsTierRewriteJobEntry);

    expect(store.refreshDatasets).toHaveBeenCalledTimes(1);
  });

  it('filters the tree while no dataset is selected', async () => {
    error.set(null);
    datasets.set([{ id: 'first', name: 'First Dataset' }] as DatasetDetails[]);
    spectator.detectChanges();
    const search = await loader.getHarness(BasicSearchHarness);

    await search.setValue('first');

    expect(await search.getValue()).toBe('first');
    expect(spectator.query('.details-container')).not.toExist();
  });

  describe('expanding the selected branch', () => {
    function makeTree(): DatasetDetails[] {
      return [
        { id: 'pool', name: 'pool', children: [{ id: 'pool/a' }] },
        { id: 'pool/a', name: 'pool/a', children: [{ id: 'pool/a/b' }] },
        { id: 'pool/a/b', name: 'pool/a/b', children: [{ id: 'pool/a/b/c' }] },
        { id: 'pool/a/b/c', name: 'pool/a/b/c', children: [] },
      ] as DatasetDetails[];
    }

    function branchTo(id: string): DatasetDetails[] {
      return datasets().filter((dataset) => id === dataset.id || id.startsWith(`${dataset.id}/`));
    }

    function isExpanded(id: string): boolean {
      const { treeControl } = spectator.component;
      return treeControl.isExpanded(treeControl.dataNodes.find((dataset) => dataset.id === id)!);
    }

    // white-box: the virtual scroll viewport has no height in jsdom, so it renders no rows to click.
    // This calls the rows' (click) handler directly.
    function clickRow(id: string): void {
      const dataset = spectator.component.treeControl.dataNodes.find((node) => node.id === id)!;
      // eslint-disable-next-line @typescript-eslint/dot-notation
      spectator.component['viewDetails'](dataset);
      spectator.detectChanges();
    }

    beforeEach(() => {
      spectator.setRouteParam('datasetId', 'pool');
      datasets.set(makeTree());
      spectator.detectChanges();
    });

    it('opens the first pool when the page is entered with nothing selected', () => {
      spectator.setRouteParam('datasetId', undefined);
      datasets.set(makeTree());
      spectator.detectChanges();

      expect(isExpanded('pool')).toBe(true);
      expect(isExpanded('pool/a')).toBe(false);
    });

    it('opens the first pool when a deep link names a dataset that does not exist', () => {
      expect(isExpanded('pool')).toBe(false);

      spectator.setRouteParam('datasetId', 'pool/gone');
      spectator.detectChanges();

      expect(isExpanded('pool')).toBe(true);
      expect(isExpanded('pool/a')).toBe(false);
    });

    it('expands the ancestors of a deep-linked dataset, but not the dataset itself', () => {
      selectedBranch.set(branchTo('pool/a/b'));
      spectator.detectChanges();

      expect(isExpanded('pool')).toBe(true);
      expect(isExpanded('pool/a')).toBe(true);
      expect(isExpanded('pool/a/b')).toBe(false);
    });

    it('toggles the selected row when it is clicked, and only selects another row', () => {
      selectedBranch.set(branchTo('pool'));
      spectator.detectChanges();
      expect(isExpanded('pool')).toBe(false);

      clickRow('pool');
      expect(isExpanded('pool')).toBe(true);

      clickRow('pool');
      expect(isExpanded('pool')).toBe(false);

      clickRow('pool');
      clickRow('pool/a');
      expect(isExpanded('pool/a')).toBe(false);
    });

    it('keeps a selected dataset the user collapsed collapsed after a reload', () => {
      selectedBranch.set(branchTo('pool/a'));
      spectator.detectChanges();
      expect(isExpanded('pool')).toBe(true);

      spectator.component.treeControl.collapse(spectator.component.treeControl.dataNodes[0]);
      datasets.set(makeTree());
      selectedBranch.set(branchTo('pool/a'));
      spectator.detectChanges();

      expect(isExpanded('pool')).toBe(false);
    });
  });

  describe('horizontal scroll width', () => {
    // The tree is virtualized, so the scroll range must not be measured from the rendered
    // rows - scrolling vertically would then reset the horizontal position (NAS-144025).
    // It is reserved from the deepest level the tree currently shows instead.
    function reservedWidth(): string {
      return spectator.query<HTMLElement>('.table-container')!.style.getPropertyValue('--ix-tree-content-width');
    }

    beforeEach(() => {
      error.set(null);
      // Selected, so the page does not open the first pool as it does when entered with nothing selected.
      spectator.setRouteParam('datasetId', 'pool');
      datasets.set([
        { id: 'pool', name: 'pool', children: [{ id: 'pool/child' }] },
        { id: 'pool/child', name: 'pool/child', children: [] },
      ] as DatasetDetails[]);
      spectator.detectChanges();
    });

    it('reserves room for the value columns only while the tree is collapsed', () => {
      expect(reservedWidth()).toBe('615px');
    });

    it('reserves one more indent once a deeper row becomes visible', () => {
      spectator.component.treeControl.expand(spectator.component.treeControl.dataNodes[0]);
      spectator.detectChanges();

      expect(reservedWidth()).toBe('655px');
    });
  });
});
