import { SpectatorRouting } from '@ngneat/spectator';
import { mockProvider, createRoutingFactory } from '@ngneat/spectator/jest';
import { CoreComponents } from 'app/core/core-components.module';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { Catalog, CatalogTrain } from 'app/interfaces/catalog.interface';
import { EntityModule } from 'app/modules/entity/entity.module';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { CatalogsComponent } from 'app/pages/apps/components/catalogs/catalogs.component';
import { DialogService } from 'app/services';

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
  });

  it('should show table rows', () => {
    const expectedRows = [['Name', 'Catalog URL', 'Branch', 'Preferred Trains']];

    spectator.detectChanges();
    const cells = spectator.queryAll('tr').map((tr) => {
      const row: string[] = [];
      tr.querySelectorAll('th').forEach((cell) => row.push(cell.textContent.trim()));
      tr.querySelectorAll('td').forEach((cell) => row.push(cell.textContent.trim()));
      return row;
    });
    expect(cells).toEqual(expectedRows);
  });
});
