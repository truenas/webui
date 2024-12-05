import { HarnessLoader, parallel } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatButtonHarness } from '@angular/material/button/testing';
import { MatSelectHarness } from '@angular/material/select/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { ArrayDataProvider } from 'app/modules/ix-table/classes/array-data-provider/array-data-provider';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';

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

describe('IxTablePagerComponent', () => {
  let spectator: Spectator<IxTablePagerComponent<TestTableData>>;
  let loader: HarnessLoader;

  const createComponent = createComponentFactory({
    component: IxTablePagerComponent<TestTableData>,
  });

  beforeEach(() => {
    const dataProvider = new ArrayDataProvider<TestTableData>();
    spectator = createComponent({
      props: { dataProvider, pageSize: 2, pageSizeOptions: [2, 10] },
    });
    spectator.component.dataProvider().setRows(testTableData);
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    spectator.fixture.detectChanges();
  });

  it('shows pages', () => {
    expect(spectator.query('.pages').textContent.trim()).toBe('1 – 2  of 4');
  });

  it('shows a list of page size options', async () => {
    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    const options = await select.getOptions();
    const optionLabels = await parallel(() => options.map((option) => option.getText()));
    expect(optionLabels).toEqual(['2', '10']);
  });

  it('sets pagination when an option is selected', async () => {
    const dataProvider = spectator.component.dataProvider();
    expect(dataProvider.pagination).toEqual({ pageNumber: 1, pageSize: 2 });

    const select = await loader.getHarness(MatSelectHarness);
    await select.open();
    await select.clickOptions({ text: '10' });

    expect(dataProvider.pagination).toEqual({ pageNumber: 1, pageSize: 10 });
    expect(spectator.query('.pages').textContent.trim()).toBe('1 – 4  of 4');
  });

  it('sets pagination when page number is changed', async () => {
    const dataProvider = spectator.component.dataProvider();
    expect(dataProvider.pagination).toEqual({ pageNumber: 1, pageSize: 2 });

    const buttons = await loader.getAllHarnesses(MatButtonHarness);
    await buttons[3].click();

    expect(dataProvider.pagination).toEqual({ pageNumber: 2, pageSize: 2 });
    expect(spectator.query('.pages').textContent.trim()).toBe('3 – 4  of 4');
  });

  it('makes buttons disabled', async () => {
    const buttons = await loader.getAllHarnesses(MatButtonHarness);

    expect(await buttons[0].isDisabled()).toBe(true);
    expect(await buttons[1].isDisabled()).toBe(true);
    expect(await buttons[2].isDisabled()).toBe(false);
    expect(await buttons[3].isDisabled()).toBe(false);

    await buttons[3].click();

    expect(await buttons[0].isDisabled()).toBe(false);
    expect(await buttons[1].isDisabled()).toBe(false);
    expect(await buttons[2].isDisabled()).toBe(true);
    expect(await buttons[3].isDisabled()).toBe(true);
  });
});
