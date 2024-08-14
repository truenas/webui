import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTablePagerShowMoreComponent } from 'app/modules/ix-table/components/ix-table-pager-show-more/ix-table-pager-show-more.component';

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

describe('IxTablePagerShowMoreComponent', () => {
  let spectator: Spectator<IxTablePagerShowMoreComponent<TestTableData>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IxTablePagerShowMoreComponent<TestTableData>,
  });

  beforeEach(() => {
    const dataProvider = new ArrayDataProvider<TestTableData>();
    spectator = createComponent({
      props: { dataProvider, pageSize: 2, ixTestOverride: ['test'] },
    });
    spectator.component.dataProvider().setRows(testTableData);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.fixture.detectChanges();
  });

  it('checks "View All" and "Collapse" buttons is present', async () => {
    const showMoreButton = await loader.getHarness(MatButtonHarness.with({ text: 'View All' }));
    expect(showMoreButton).toExist();
    await showMoreButton.click();

    const collapseButton = await loader.getHarness(MatButtonHarness.with({ text: 'Collapse' }));
    expect(collapseButton).toExist();
    await collapseButton.click();
    expect(showMoreButton).toExist();
  });
});
