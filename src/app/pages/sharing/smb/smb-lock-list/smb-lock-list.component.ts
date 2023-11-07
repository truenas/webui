import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { of, tap } from 'rxjs';
import { SmbInfoLevel } from 'app/enums/smb-info-level.enum';
import { SmbLockInfo, SmbOpenInfo } from 'app/interfaces/smb-status.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
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
  columns = createTable<SmbLockInfo>([
    textColumn({ title: this.translate.instant('Path'), propertyName: 'service_path' }),
    textColumn({ title: this.translate.instant('Filename'), propertyName: 'filename' }),
    textColumn({ title: this.translate.instant('Num Pending Deletes'), propertyName: 'num_pending_deletes' }),
    textColumn({ title: this.translate.instant('Dev Id'), propertyName: 'fileid', getValue: (row) => row.fileid.devid }),
    textColumn({ title: this.translate.instant('Ext Id'), propertyName: 'fileid', getValue: (row) => row.fileid.extid }),
    textColumn({ title: this.translate.instant('Inode'), propertyName: 'fileid', getValue: (row) => row.fileid.inode }),
  ]);

  openFilesDataProvider: AsyncDataProvider<SmbOpenInfo>;
  openFilesColumns = createTable<SmbOpenInfo>([
    textColumn({
      title: this.translate.instant('Process Id'),
      propertyName: 'server_id',
      getValue: (row) => row.server_id.pid,
    }),
    textColumn({
      title: this.translate.instant('User Id'),
      propertyName: 'uid',
    }),
    textColumn({
      title: this.translate.instant('Share File Id'),
      propertyName: 'share_file_id',
    }),
    textColumn({
      title: this.translate.instant('Share Mode'),
      propertyName: 'sharemode',
      getValue: (row) => row.sharemode.text,
    }),
    textColumn({
      title: this.translate.instant('Access Mask'),
      propertyName: 'access_mask',
      getValue: (row) => row.access_mask.text,
    }),
    textColumn({
      title: this.translate.instant('Caching'),
      propertyName: 'caching',
      getValue: (row) => row.caching.text,
    }),
    textColumn({
      title: this.translate.instant('Opened at'),
      propertyName: 'opened_at',
    }),
  ]);

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
    this.dataProvider.expandedRow$.pipe(untilDestroyed(this)).subscribe((row) => {
      this.setOpenFiles(row);
    });
  }

  loadData(): void {
    this.dataProvider.load();
  }

  setOpenFiles(row: SmbLockInfo): void {
    const openFiles = row?.opens ? Object.values(row.opens) : [];
    this.openFilesDataProvider = new AsyncDataProvider(of(openFiles));
    this.openFilesDataProvider.load();
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
