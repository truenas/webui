import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { SortDirection } from '@swimlane/ngx-datatable';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { IxTableHeadComponent } from 'app/modules/ix-table2/components/ix-table-head/ix-table-head.component';
import { TableColumn } from 'app/modules/ix-table2/interfaces/table-column.interface';

interface TestTableData {
  numberField: number;
  stringField: string;
  booleanField: boolean;
}

const columns: TableColumn<TestTableData>[] = [
  {
    title: 'Number Field',
    propertyName: 'numberField',
    sortable: true,
  },
  {
    title: 'String Field',
    propertyName: 'stringField',
    sortable: true,
  },
  {
    title: 'Boolean Field',
    propertyName: 'booleanField',
  },
];

let headers: HTMLDivElement[];

describe('IxTableHeadComponent', () => {
  let spectator: Spectator<IxTableHeadComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxTableHeadComponent<TestTableData>,
  });

  beforeEach(() => {
    const dataProvider = new ArrayDataProvider<TestTableData>();
    spectator = createComponent({
      props: { columns, dataProvider },
    });
    headers = spectator.queryAll('th');
  });

  it('shows titles', () => {
    expect(headers.map((header) => header.querySelector('.title').textContent)).toEqual([
      'Number Field',
      'String Field',
      'Boolean Field',
    ]);
  });

  it('sets sorting when clicking on one heading', () => {
    const dataProvider = spectator.component.dataProvider;
    expect(headers).toHaveLength(3);
    expect(dataProvider.sorting).toEqual({ active: null, direction: null, propertyName: null });
    headers[0].click();
    expect(dataProvider.sorting).toEqual({ active: 0, direction: SortDirection.asc, propertyName: 'numberField' });
    headers[0].click();
    expect(dataProvider.sorting).toEqual({ active: 0, direction: SortDirection.desc, propertyName: 'numberField' });
    headers[0].click();
    expect(dataProvider.sorting).toEqual({ active: 0, direction: null, propertyName: 'numberField' });
  });

  it('sets sorting when clicking on different headings', () => {
    const dataProvider = spectator.component.dataProvider;
    expect(headers).toHaveLength(3);

    expect(dataProvider.sorting).toEqual({ active: null, direction: null, propertyName: null });
    headers[0].click();
    expect(dataProvider.sorting).toEqual({ active: 0, direction: SortDirection.asc, propertyName: 'numberField' });
    headers[1].click();
    expect(dataProvider.sorting).toEqual({ active: 1, direction: SortDirection.asc, propertyName: 'stringField' });
  });

  it('sets sorting when clicking on an unsortable heading', () => {
    const dataProvider = spectator.component.dataProvider;
    expect(headers).toHaveLength(3);

    expect(dataProvider.sorting).toEqual({ active: null, direction: null, propertyName: null });
    headers[2].click();
    expect(dataProvider.sorting).toEqual({ active: null, direction: null, propertyName: null });
  });
});
