import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, input, OnChanges, inject, signal,
} from '@angular/core';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCardComponent, TnCardHeaderDirective, TnCellDefDirective, TnHeaderCellDefDirective, TnTableColumnDirective,
  TnTableComponent, TnTablePagerComponent,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { SmbLockInfo, SmbOpenInfo } from 'app/interfaces/smb-status.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { convertStringToId, createTable, toDisplayedColumns } from 'app/modules/ix-table/utils';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-smb-open-files',
  templateUrl: './smb-open-files.component.html',
  styleUrls: ['./smb-open-files.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TestDirective,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnTablePagerComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SmbOpenFilesComponent implements OnChanges {
  private translate = inject(TranslateService);
  protected emptyService = inject(EmptyService);

  lock = input<SmbLockInfo>();
  files = computed<SmbOpenInfo[]>(() => {
    return Object.values(this.lock()?.opens || []);
  });

  dataProvider: AsyncDataProvider<SmbOpenInfo>;
  protected readonly columns = signal(createTable<SmbOpenInfo>([
    textColumn({
      title: this.translate.instant('Server'),
      propertyName: 'server_id',
      getValue: (row) => {
        return Object.values(row.server_id).join(':');
      },
    }),
    textColumn({
      title: this.translate.instant('Username'),
      propertyName: 'uid',
      getValue: (row) => {
        return `${row.username} (${row.uid})`;
      },
    }),
    textColumn({ title: this.translate.instant('Opened at'), propertyName: 'opened_at' }),
  ], {
    uniqueRowTag: (row) => `smb-open-file-${row.username}-${row.uid}`,
    ariaLabels: (row) => [row.username, this.translate.instant('SMB Open File')],
  }));

  protected readonly displayedColumns = computed(() => toDisplayedColumns(this.columns()));

  protected readonly trackByOpenFile = (_index: number, row: SmbOpenInfo): string => {
    return `${row.username}-${row.uid}`;
  };

  protected formatServer(row: SmbOpenInfo): string {
    return Object.values(row.server_id).join(':');
  }

  protected formatUsername(row: SmbOpenInfo): string {
    return `${row.username} (${row.uid})`;
  }

  protected uniqueRowTag(row: SmbOpenInfo): string {
    return convertStringToId(`smb-open-file-${row.username}-${row.uid}`);
  }

  private createProvider(): void {
    this.dataProvider = new AsyncDataProvider(of(this.files()));
    this.dataProvider.load();
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if (changes.lock.firstChange || changes.lock.currentValue !== changes.lock.previousValue) {
      this.createProvider();
    }
  }
}
