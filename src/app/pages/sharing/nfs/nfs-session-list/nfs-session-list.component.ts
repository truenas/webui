import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MatButtonToggleChange } from '@angular/material/button-toggle';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { map, tap } from 'rxjs';
import { stringToTitleCase } from 'app/helpers/string-to-title-case';
import { Nfs3Session, Nfs4Session, NfsType } from 'app/interfaces/nfs-share.interface';
import { AsyncDataProvider } from 'app/modules/ix-table2/async-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { Column, ColumnComponent } from 'app/modules/ix-table2/interfaces/table-column.interface';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './nfs-session-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NfsSessionListComponent implements OnInit {
  activeNfsType: NfsType = NfsType.Nfs3;

  filterString = '';
  sessions: Nfs3Session[] | Nfs4Session['info'][] = [];
  readonly NfsType = NfsType;

  nfs3Columns = createTable<Nfs3Session>([
    textColumn({
      title: this.translate.instant('IP'),
      propertyName: 'ip',
    }),
    textColumn({
      title: this.translate.instant('Export'),
      propertyName: 'export',
    }),
  ]);

  nfs4Columns = createTable<Nfs4Session['info']>([
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    textColumn({
      title: this.translate.instant('Client ID'),
      propertyName: 'clientid',
    }),
    textColumn({
      title: this.translate.instant('Address'),
      propertyName: 'address',
    }),
    textColumn({
      title: this.translate.instant('Status'),
      propertyName: 'status',
      getValue: (row) => stringToTitleCase(row.status),
    }),
    textColumn({
      title: this.translate.instant('Seconds From Last Renew'),
      propertyName: 'seconds from last renew',
    }),
    textColumn({
      title: this.translate.instant('Minor Version'),
      propertyName: 'minor version',
      hidden: true,
    }),
    textColumn({
      title: this.translate.instant('Implementation Domain'),
      hidden: true,
      propertyName: 'Implementation domain',
    }),
    textColumn({
      title: this.translate.instant('Implementation Name'),
      hidden: true,
      propertyName: 'Implementation name',
    }),
    textColumn({
      title: this.translate.instant('Callback State'),
      hidden: true,
      propertyName: 'callback state',
    }),
    textColumn({
      title: this.translate.instant('Callback Address'),
      propertyName: 'callback address',
      hidden: true,
    }),
  ]);

  nfs3ProviderRequest$ = this.ws.call('nfs.get_nfs3_clients', []).pipe(
    tap((sessions) => {
      this.sessions = sessions;
      if (this.filterString) {
        this.onListFiltered(this.filterString);
      }
    }),
    untilDestroyed(this),
  );

  nfs3DataProvider = new AsyncDataProvider<Nfs3Session>(this.nfs3ProviderRequest$);

  nfs4ProviderRequest$ = this.ws.call('nfs.get_nfs4_clients', []).pipe(
    map((sessions) => sessions.map((session) => session.info)),
    tap((sessions) => {
      this.sessions = sessions;
      if (this.filterString) {
        this.onListFiltered(this.filterString);
      }
    }),
    untilDestroyed(this),
  );

  nfs4DataProvider = new AsyncDataProvider<Nfs4Session['info']>(this.nfs4ProviderRequest$);

  constructor(
    private ws: WebSocketService,
    private translate: TranslateService,
    private cdr: ChangeDetectorRef,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  nfsTypeChanged(changedValue: MatButtonToggleChange): void {
    if (this.activeNfsType === changedValue.value) {
      return;
    }

    if (this.activeNfsType === NfsType.Nfs3 && changedValue.value === NfsType.Nfs4) {
      this.activeNfsType = NfsType.Nfs4;
      this.loadData();
    } else {
      this.activeNfsType = NfsType.Nfs3;
      this.loadData();
    }
  }

  loadData(): void {
    if (this.activeNfsType === NfsType.Nfs3) {
      this.nfs3DataProvider.load();
    } else {
      this.nfs4DataProvider.load();
    }
  }

  onListFiltered(query: string): void {
    this.filterString = query?.toString()?.toLowerCase();

    if (this.activeNfsType === NfsType.Nfs3) {
      this.filterNfs3Data();
    } else {
      this.filterNfs4Data();
    }
  }

  columnsChange(columns: unknown): void {
    if (this.activeNfsType === NfsType.Nfs3) {
      this.nfs3Columns = [...columns as Column<Nfs3Session, ColumnComponent<Nfs3Session>>[]];
    } else {
      this.nfs4Columns = [...columns as Column<Nfs4Session['info'], ColumnComponent<Nfs4Session['info']>>[]];
    }

    this.cdr.detectChanges();
    this.cdr.markForCheck();
  }

  private filterNfs3Data(): void {
    this.nfs3DataProvider.setRows((this.sessions as Nfs3Session[]).filter((session: Nfs3Session) => {
      return [
        session.export,
        session.ip,
      ].some((value) => value.toString().toLowerCase().includes(this.filterString));
    }));
  }

  private filterNfs4Data(): void {
    this.nfs4DataProvider.setRows((this.sessions as Nfs4Session['info'][]).filter((session: Nfs4Session['info']) => {
      return [
        session.name,
        session.clientid,
        session.address,
        session.status,
        session['seconds from last renew'],
      ].some((value) => value.toString().toLowerCase().includes(this.filterString));
    }));
  }
}
