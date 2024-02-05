import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { tap } from 'rxjs';
import { SmbInfoLevel } from 'app/enums/smb-info-level.enum';
import { SmbNotificationInfo } from 'app/interfaces/smb-status.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
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
    rowTestId: (row) => 'smb-notification-' + row.creation_time + '-' + row.server_id.unique_id,
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
  }

  loadData(): void {
    this.dataProvider.load();
  }

  onListFiltered(query: string): void {
    this.filterString = query?.toString()?.toLowerCase();
    this.dataProvider.setRows(this.notifications.filter((notification) => {
      return [
        notification.path,
        notification.filter,
        notification.subdir_filter,
        notification.creation_time,
      ].some((value) => value.toString().toLowerCase().includes(this.filterString));
    }));
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}
