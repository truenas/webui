import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { tap } from 'rxjs';
import { SmbInfoLevel } from 'app/enums/smb-info-level.enum';
import { SmbNotificationInfo } from 'app/interfaces/smb-status.interface';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table/utils';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-smb-notification-list',
  templateUrl: './smb-notification-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SmbNotificationListComponent implements OnInit {
  filterString = '';
  dataProvider: AsyncDataProvider<SmbNotificationInfo>;
  notifications: SmbNotificationInfo[] = [];

  columns = createTable<SmbNotificationInfo>([
    textColumn({ title: this.translate.instant('Path'), propertyName: 'path' }),
    textColumn({ title: this.translate.instant('Filter'), propertyName: 'filter' }),
    textColumn({ title: this.translate.instant('Subdir Filter'), propertyName: 'subdir_filter' }),
    textColumn({ title: this.translate.instant('Creation Time'), propertyName: 'creation_time' }),
  ], {
    uniqueRowTag: (row) => 'smb-notification-' + row.creation_time + '-' + row.server_id.unique_id,
    ariaLabels: (row) => [row.creation_time, this.translate.instant('SMB Notification')],
  });

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const smbStatus$ = this.ws.call('smb.status', [SmbInfoLevel.Notifications]).pipe(
      tap((shares: SmbNotificationInfo[]) => {
        this.notifications = shares;
        if (this.filterString) {
          this.onListFiltered(this.filterString);
        }
      }),
      untilDestroyed(this),
    );

    this.dataProvider = new AsyncDataProvider<SmbNotificationInfo>(smbStatus$);
    this.loadData();
    this.dataProvider.emptyType$.pipe(untilDestroyed(this)).subscribe(() => {
      this.onListFiltered(this.filterString);
    });
  }

  loadData(): void {
    this.dataProvider.load();
  }

  onListFiltered(query: string): void {
    this.filterString = query?.toString()?.toLowerCase();
    this.dataProvider.setFilter({
      query,
      columnKeys: ['path', 'filter', 'subdir_filter', 'creation_time'],
    });
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}
