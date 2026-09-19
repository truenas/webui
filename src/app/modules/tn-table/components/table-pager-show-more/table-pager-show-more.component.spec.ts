import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { TnButtonHarness } from '@truenas/ui-components';
import { ArrayDataProvider } from 'app/modules/tn-table/classes/array-data-provider/array-data-provider';
import { TablePagerShowMoreComponent } from 'app/modules/tn-table/components/table-pager-show-more/table-pager-show-more.component';

interface TestTableData {
  numberField: number;
  stringField: string;
  booleanField: boolean;
}

const testTableData: TestTableData[] = [
  { numberField: 1, stringField: 'a', booleanField: true },
  { numberField: 2, stringField: 'c', booleanField: false },
  { numberField: 4, stringField: 'b', booleanField: false },
  { numberField: 3, stringField: 'd', booleanField: true },
];

describe('TablePagerShowMoreComponent', () => {
  let spectator: Spectator<TablePagerShowMoreComponent<TestTableData>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: TablePagerShowMoreComponent<TestTableData>,
  });

  beforeEach(() => {
    const dataProvider = new ArrayDataProvider<TestTableData>();
    spectator = createComponent({
      props: { dataProvider, pageSize: 2, testId: ['test'] },
    });
    spectator.component.dataProvider().setRows(testTableData);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.fixture.detectChanges();
  });

  // The one place in NAS-143893 where id composition moved from repo code into a library helper
  // (`[...base, key]` → `scopeTestId`), so the emitted value is pinned rather than assumed: this is
  // what would catch a library-side change to that contract across the 19 cards that bind it.
  it('scopes both button ids off the testId base', async () => {
    // Located by component selector, asserted on the attribute — only one of the two renders at a
    // time, and `tn-button` writes the id on the inner <button> rather than its host.
    expect(spectator.query('tn-button button')).toHaveAttribute('data-test', 'button-test-show-more');

    await (await loader.getHarness(TnButtonHarness.with({ text: 'View All' }))).click();

    expect(spectator.query('tn-button button')).toHaveAttribute('data-test', 'button-test-show-less');
  });

  it('checks "View All" and "Collapse" buttons is present', async () => {
    const showMoreButton = await loader.getHarness(TnButtonHarness.with({ text: 'View All' }));
    expect(showMoreButton).toExist();
    await showMoreButton.click();

    const collapseButton = await loader.getHarness(TnButtonHarness.with({ text: 'Collapse' }));
    expect(collapseButton).toExist();
    await collapseButton.click();
    expect(showMoreButton).toExist();
  });
});
