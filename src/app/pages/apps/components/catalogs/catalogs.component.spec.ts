import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { SpectatorRouting } from '@ngneat/spectator';
import { mockProvider, createRoutingFactory } from '@ngneat/spectator/jest';
import { MockModule } from 'ng-mocks';
import { of } from 'rxjs';
import { CoreComponents } from 'app/core/core-components.module';
import { mockAuth } from 'app/core/testing/utils/mock-auth.utils';
import { mockCall, mockJob, mockWebSocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Catalog, CatalogTrain } from 'app/interfaces/catalog.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { PageHeaderModule } from 'app/modules/page-header/page-header.module';
import { SearchInput1Component } from 'app/modules/search-input1/search-input1.component';
import { CatalogsComponent } from 'app/pages/apps/components/catalogs/catalogs.component';
import { WebSocketService } from 'app/services/ws.service';

const fakeCatalogDataSource: Catalog[] = [
  {
    label: 'TRUENAS',
    repository: 'https://github.com/truenas/charts.git',
    branch: 'master',
    builtin: true,
    preferred_trains: ['charts', 'community'],
    location: '/tmp/ix-applications/catalogs/github_com_truenas_charts_git_master',
    id: 'TRUENAS',
    trains: {
      charts: {},
    } as Record<string, CatalogTrain>,
  },
  {
    label: 'TRUECHARTS',
    repository: 'https://github.com/truecharts/catalog.git',
    branch: 'main',
    builtin: false,
    preferred_trains: ['enterprise', 'stable', 'operators'],
    location: '/tmp/ix-applications/catalogs/github_com_truechart_catalog_git_master',
    id: 'TRUECHARTS',
    trains: {
      charts: {},
    } as Record<string, CatalogTrain>,
  },
] as Catalog[];

describe('CatalogsComponent', () => {
  let spectator: SpectatorRouting<CatalogsComponent>;
  let loader: HarnessLoader;

  const createComponent = createRoutingFactory({
    component: CatalogsComponent,
    imports: [
      CoreComponents,
      IxTable2Module,
      MockModule(PageHeaderModule),
      SearchInput1Component,
    ],
    declarations: [],
    providers: [
      mockProvider(DialogService, {
        jobDialog: jest.fn(() => ({
          afterClosed: () => of(null),
        })),
      }),
      mockWebSocket([
        mockCall('core.get_jobs'),
        mockCall('catalog.query', fakeCatalogDataSource),
        mockCall('catalog.delete', true),
        mockJob('catalog.sync'),
        mockJob('catalog.sync_all'),
      ]),
      mockAuth(),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
  });

  it('should show table rows', async () => {
    const expectedRows = [
      ['Name', 'Catalog URL', 'Branch', 'Preferred Trains'],
      ['TRUECHARTS', 'https://github.com/truecharts/catalog.git', 'main', 'enterprise,stable,operators'],
      ['TRUENAS', 'https://github.com/truenas/charts.git', 'master', 'charts,community'],
    ];

    const table = await loader.getHarness(IxTable2Harness);
    const cells = await table.getCellTexts();
    expect(cells).toEqual(expectedRows);
  });

  it('refreshes charts when Refresh Charts is pressed', async () => {
    const refreshAllButton = await loader.getHarness(MatButtonHarness.with({ text: 'Refresh All' }));
    await refreshAllButton.click();

    expect(spectator.inject(DialogService).jobDialog).toHaveBeenCalled();
    expect(spectator.inject(WebSocketService).job).toHaveBeenCalledWith('catalog.sync_all');
  });
});
