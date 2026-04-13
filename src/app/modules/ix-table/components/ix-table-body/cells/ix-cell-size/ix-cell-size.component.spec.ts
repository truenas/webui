import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { TranslateModule } from '@ngx-translate/core';
import { IxCellSizeComponent } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-size/ix-cell-size.component';

interface TestTableData { numberField: number | null }

describe('IxCellSizeComponent', () => {
  let spectator: Spectator<IxCellSizeComponent<TestTableData>>;

  const createComponent = createComponentFactory({
    component: IxCellSizeComponent<TestTableData>,
    imports: [TranslateModule.forRoot()],
    detectChanges: false,
  });

  beforeEach(() => {
    spectator = createComponent();
    spectator.component.uniqueRowTag = () => '';
  });

  it('shows file size in template', () => {
    spectator.component.propertyName = 'numberField';
    spectator.component.setRow({ numberField: 5 * 1024 * 1024 * 1024 });
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('5 GiB');
  });

  it('shows N/A when value is null', () => {
    spectator.component.propertyName = 'numberField';
    spectator.component.setRow({ numberField: null });
    spectator.detectChanges();

    expect(spectator.element.textContent!.trim()).toBe('N/A');
  });
});
