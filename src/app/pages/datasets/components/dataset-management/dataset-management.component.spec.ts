import { Location } from '@angular/common';
import { Router } from '@angular/router';
import { createRoutingFactory, SpectatorRouting, mockProvider } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { SystemDatasetConfig } from 'app/interfaces/system-dataset-config.interface';
import { EmptyComponent } from 'app/modules/empty/empty.component';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { TreeModule } from 'app/modules/ix-tree/tree.module';
import { DatasetsManagementComponent } from 'app/pages/datasets/components/dataset-management/dataset-management.component';
import { DatasetTreeStore } from 'app/pages/datasets/store/dataset-store.service';

describe('DatasetsManagementComponent', () => {
  let spectator: SpectatorRouting<DatasetsManagementComponent>;
  let router: Router;
  let location: Location;

  const createComponent = createRoutingFactory({
    component: DatasetsManagementComponent,
    imports: [TreeModule, SearchInput1Component, EmptyComponent],
    providers: [
      mockAuth(),
      mockWebSocket([
        mockCall('systemdataset.config', {} as SystemDatasetConfig),
      ]),
      mockProvider(DatasetTreeStore, {
        datasets$: of([{ id: 'first', name: 'First Dataset' }, { id: 'second', name: 'Second Dataset' }]),
        loadDatasets: () => {},
        selectedBranch$: of(false),
        isLoading$: of(false),
        selectDatasetById: () => {},
        error$: of(null),
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
});
