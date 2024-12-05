import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSlideToggleHarness } from '@angular/material/slide-toggle/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { toggleColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-toggle/ix-cell-toggle.component';
import { yesNoColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-yes-no/ix-cell-yes-no.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { createTable } from 'app/modules/ix-table/utils';

interface TestTableData {
  numberField: number;
  stringField: string;
  yesNoField: boolean;
  enabledField: boolean;
}

const testTableData: TestTableData[] = [
  {
    numberField: 1, stringField: 'a', yesNoField: true, enabledField: true,
  },
  {
    numberField: 2, stringField: 'c', yesNoField: false, enabledField: true,
  },
  {
    numberField: 4, stringField: 'b', yesNoField: false, enabledField: false,
  },
  {
    numberField: 3, stringField: 'd', yesNoField: true, enabledField: false,
  },
];

const columns = createTable<TestTableData>([
  textColumn({
    title: 'Number Field',
    propertyName: 'numberField',
  }),
  textColumn({
    title: 'String Field',
    propertyName: 'stringField',
  }),
  yesNoColumn({
    title: 'Boolean Field',
    propertyName: 'yesNoField',
  }),
  toggleColumn({
    title: 'Boolean Field',
    propertyName: 'enabledField',
    onRowToggle: () => jest.fn(),
  }),
], {
  uniqueRowTag: (row) => 'row-' + row.numberField.toString(),
  ariaLabels: (row) => ['Column', row.stringField],
});

describe('IxTableBodyComponent', () => {
  let spectator: Spectator<IxTableBodyComponent<TestTableData>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IxTableBodyComponent<TestTableData>,
  });

  beforeEach(() => {
    const dataProvider = new ArrayDataProvider<TestTableData>();
    spectator = createComponent({
      props: { columns, dataProvider },
    });
    spectator.component.dataProvider().setRows(testTableData);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.fixture.detectChanges();
  });

  it('shows rows', () => {
    const rows = spectator.queryAll('.row');
    expect(rows).toHaveLength(4);
    expect(
      spectator.queryAll('.row').map((row) => {
        const values: string[] = [];
        row.querySelectorAll('td').forEach((td) => values.push(td.textContent.trim()));
        return values;
      }),
    ).toEqual([
      ['1', 'a', 'Yes', ''],
      ['2', 'c', 'No', ''],
      ['4', 'b', 'No', ''],
      ['3', 'd', 'Yes', ''],
    ]);
  });

  it('shows toggle column', async () => {
    const toggles = await loader.getAllHarnesses(MatSlideToggleHarness);
    const values = await parallel(() => toggles.map(async (toggle) => toggle.isChecked()));
    expect(values).toEqual(testTableData.map((row) => row.enabledField));
  });
});
