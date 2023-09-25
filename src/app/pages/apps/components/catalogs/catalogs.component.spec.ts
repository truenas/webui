import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { SpectatorRouting } from '@ngneat/spectator';
import { mockProvider, createRoutingFactory } from '@ngneat/spectator/jest';
import { CoreComponents } from 'app/core/core-components.module';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Catalog, CatalogTrain } from 'app/interfaces/catalog.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTable2Harness } from 'app/modules/ix-table2/components/ix-table2/ix-table2.harness';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { CatalogsComponent } from 'app/pages/apps/components/catalogs/catalogs.component';
import { DialogService } from 'app/services/dialog.service';

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
      charts: {} as unknown as CatalogTrain,
    },
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
      charts: {} as unknown as CatalogTrain,
    },
  },
] as unknown as Catalog[];

describe('CatalogsComponent', () => {
  let spectator: SpectatorRouting<CatalogsComponent>;
  let loader: HarnessLoader;

  const createComponent = createRoutingFactory({
    component: CatalogsComponent,
    imports: [EntityModule, CoreComponents, IxTable2Module],
    declarations: [],
    providers: [
      mockProvider(DialogService),
      mockWebsocket([
        mockCall('core.get_jobs'),
        mockCall('catalog.query', fakeCatalogDataSource),
        mockCall('catalog.delete', true),
      ]),
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
});
