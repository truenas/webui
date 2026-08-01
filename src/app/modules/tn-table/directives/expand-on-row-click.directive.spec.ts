/* eslint-disable @angular-eslint/component-max-inline-declarations */
import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import {
  TnCellDefDirective,
  TnDetailRowDefDirective,
  TnHeaderCellDefDirective,
  TnTableColumnDirective,
  TnTableComponent,
  TnTableHarness,
} from '@truenas/ui-components';
import { ExpandOnRowClickDirective } from 'app/modules/tn-table/directives/expand-on-row-click.directive';

interface Row { name: string }

@Component({
  selector: 'ix-expand-on-row-click-test',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tn-table
      ixExpandOnRowClick
      [dataSource]="rows"
      [displayedColumns]="['name']"
      [expandable]="true"
      [clickable]="true"
    >
      <ng-container [tnColumnDef]="'name'">
        <ng-template tnHeaderCellDef>Name</ng-template>
        <ng-template let-row tnCellDef>{{ row.name }}</ng-template>
      </ng-container>

      <ng-template let-row tnDetailRowDef>
        <div class="detail">Details for {{ row.name }}</div>
      </ng-template>
    </tn-table>
  `,
  imports: [
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnDetailRowDefDirective,
    ExpandOnRowClickDirective,
  ],
})
class TestHostComponent {
  protected readonly rows: Row[] = [{ name: 'tank' }, { name: 'dozer' }];
}

describe('ExpandOnRowClickDirective', () => {
  let spectator: Spectator<TestHostComponent>;
  let loader: HarnessLoader;
  let table: TnTableHarness;

  const createComponent = createComponentFactory({
    component: TestHostComponent,
  });

  beforeEach(async () => {
    spectator = createComponent();
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    table = await loader.getHarness(TnTableHarness);
  });

  it('expands a row when the row itself is clicked, not only its chevron', async () => {
    expect(await table.isRowExpanded(0)).toBe(false);

    await table.clickRow(0);

    expect(await table.isRowExpanded(0)).toBe(true);
    expect(await table.getDetailRowContent(0)).toContain('Details for tank');
  });

  it('collapses an expanded row when it is clicked again', async () => {
    await table.clickRow(0);
    await table.clickRow(0);

    expect(await table.isRowExpanded(0)).toBe(false);
  });

  it('only expands the row that was clicked', async () => {
    await table.clickRow(1);

    expect(await table.isRowExpanded(0)).toBe(false);
    expect(await table.isRowExpanded(1)).toBe(true);
  });
});
