import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuHarness } from '@angular/material/menu/testing';
import { Spectator } from '@ngneat/spectator';
import { createComponentFactory } from '@ngneat/spectator/jest';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { EntityModule } from 'app/modules/entity/entity.module';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { yesNoColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-yesno/ix-cell-yesno.component';
import { IxTableColumnsSelectorComponent } from 'app/modules/ix-table2/components/ix-table-columns-selector/ix-table-columns-selector.component';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';
import { IxTable2Module } from 'app/modules/ix-table2/ix-table2.module';
import { createTable } from 'app/modules/ix-table2/utils';
import { AppLoaderModule } from 'app/modules/loader/app-loader.module';
import { CronjobRow } from 'app/pages/system/advanced/cron/cron-list/cronjob-row.interface';

describe('IxTableColumnsSelectorComponent', () => {
  let spectator: Spectator<IxTableColumnsSelectorComponent>;
  let loader: HarnessLoader;
  let menu: MatMenuHarness;
  let matDialog: MatDialog;
  const testColumns = createTable<CronjobRow>([
    textColumn({
      title: 'Users',
      propertyName: 'user',
    }),
    textColumn({
      title: 'Command',
      propertyName: 'command',
    }),
    textColumn({
      title: 'Description',
      propertyName: 'description',
      hidden: true,
    }),
    textColumn({
      title: 'Schedule',
      propertyName: 'schedule',
    }),
    yesNoColumn({
      title: 'Enabled',
      propertyName: 'enabled',
      hidden: true,
    }),
  ]) as Column<unknown, ColumnComponent<unknown>>[];

  const createComponent = createComponentFactory({
    component: IxTableColumnsSelectorComponent,
    imports: [
      AppLoaderModule,
      EntityModule,
      IxTable2Module,
      TranslateModule,
    ],
    providers: [
      TranslateService,
    ],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        columns: testColumns,
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    menu = await loader.getHarness(MatMenuHarness);
    matDialog = spectator.inject(MatDialog);
    jest.spyOn(matDialog, 'open').mockImplementation();
    await menu.open();
  });

  it('checks when "Unselect All" is pressed', async () => {
    await menu.clickItem({ text: 'Unselect All' });

    expect(spectator.component.hiddenColumns.selected).toHaveLength(spectator.component.columns.length - 1);
  });

  it('checks when "Reset to Defaults" is pressed', async () => {
    jest.spyOn(spectator.component, 'resetToDefaults').mockImplementation();
    await menu.clickItem({ text: 'Reset to Defaults' });

    expect(spectator.component.hiddenColumns.selected).toHaveLength(2);
    expect(spectator.component.resetToDefaults).toHaveBeenCalled();
  });
});
