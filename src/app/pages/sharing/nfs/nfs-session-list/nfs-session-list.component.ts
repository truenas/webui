import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { tap } from 'rxjs';
import { NfsSession } from 'app/interfaces/nfs-share.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './nfs-session-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NfsSessionListComponent implements OnInit {
  filterString = '';
  dataProvider: AsyncDataProvider<NfsSession>;
  sessions: NfsSession[] = [];

  columns = createTable<NfsSession>([
    textColumn({ title: this.translate.instant('Session ID'), propertyName: 'ip' }),
    textColumn({ title: this.translate.instant('Hostname'), propertyName: 'hostname', hidden: true }),
    textColumn({ title: this.translate.instant('Remote machine'), propertyName: 'remote_machine', hidden: true }),
    textColumn({ title: this.translate.instant('Username'), propertyName: 'username', hidden: true }),
  ]);

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const smbStatus$ = this.ws.call('nfs.get_nfs3_clients', []).pipe(
      tap((sessions) => {
        this.sessions = sessions;
        if (this.filterString) {
          this.onListFiltered(this.filterString);
        }
      }),
      untilDestroyed(this),
    );

    this.dataProvider = new AsyncDataProvider<NfsSession>(smbStatus$);
    this.loadData();
  }

  loadData(): void {
    this.dataProvider.load();
  }

  onListFiltered(query: string): void {
    this.filterString = query?.toString()?.toLowerCase();
    this.dataProvider.setRows(this.sessions.filter((session) => {
      return [
        session.session_id,
        session.hostname,
        session.remote_machine,
        session.username,
        session.groupname,
        session.uid,
        session.gid,
        session.session_dialect,
      ].some((value) => value.toString().toLowerCase().includes(this.filterString));
    }));
  }

  columnsChange(columns: typeof this.columns): void {
    this.columns = [...columns];
    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }
}
