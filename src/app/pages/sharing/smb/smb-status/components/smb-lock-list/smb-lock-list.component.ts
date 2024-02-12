import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { tap } from 'rxjs';
import { SmbInfoLevel } from 'app/enums/smb-info-level.enum';
import { SmbLockInfo, SmbOpenInfo } from 'app/interfaces/smb-status.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-smb-lock-list',
  templateUrl: './smb-lock-list.component.html',
  styleUrls: ['./smb-lock-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmbLockListComponent implements OnInit {
  filterString = '';
  dataProvider: AsyncDataProvider<SmbLockInfo>;
  locks: SmbLockInfo[] = [];
  files: SmbOpenInfo[] = [];
  columns = createTable<SmbLockInfo>([
    textColumn({ title: this.translate.instant('Path'), propertyName: 'service_path' }),
    textColumn({ title: this.translate.instant('Filename'), propertyName: 'filename' }),
    textColumn({
      title: this.translate.instant('File ID'),
      propertyName: 'fileid',
      getValue: (row) => {
        return Object.values(row.fileid).join(':');
      },
    }),
    textColumn({
      title: this.translate.instant('Open Files'),
      propertyName: 'opens',
      getValue: (row) => {
        return this.translate.instant('{n, plural, =0 {No open files} one {# open file} other {# open files}}', { n: Object.keys(row.opens).length });
      },
    }),
    textColumn({
      title: this.translate.instant('Num Pending Deletes'),
      propertyName: 'num_pending_deletes',
    }),
  ], {
    rowTestId: (row) => 'smb-lock-' + row.filename + '-' + row.fileid.devid + '-' + row.fileid.extid,
  });

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const smbStatus$ = this.ws.call('smb.status', [SmbInfoLevel.Locks]).pipe(
      tap((locks: SmbLockInfo[]) => {
        this.locks = locks;
        if (this.filterString) {
          this.onListFiltered(this.filterString);
        }
      }),
      untilDestroyed(this),
    );

    this.dataProvider = new AsyncDataProvider(smbStatus$);
    this.loadData();
  }

  loadData(): void {
    this.dataProvider.load();
  }

  onListFiltered(query: string): void {
    this.filterString = query?.toString()?.toLowerCase();
    this.dataProvider.setRows(this.locks.filter((lock) => {
      return [
        lock.filename,
        lock.service_path,
      ].some((value) => value.toString().toLowerCase().includes(this.filterString));
    }));
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}
