import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, signal, OnInit,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter, shareReplay, switchMap } from 'rxjs/operators';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { FibreChannelPort } from 'app/interfaces/fibre-channel.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { SearchInput1Component } from 'app/modules/forms/search-input1/search-input1.component';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTablePagerComponent } from 'app/modules/ix-table/components/ix-table-pager/ix-table-pager.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { fibreChannelPortsElements } from 'app/pages/sharing/iscsi/fibre-channel-ports/fibre-channel-ports.elements';
import { FibreChannelPortsFormComponent } from 'app/pages/sharing/iscsi/fibre-channel-ports-form/fibre-channel-ports-form.component';
import { SlideInService } from 'app/services/slide-in.service';
import { ApiService } from 'app/services/websocket/api.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-fibre-channel-ports',
  templateUrl: './fibre-channel-ports.component.html',
  styleUrl: './fibre-channel-ports.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    FakeProgressBarComponent,
    MatCard,
    MatToolbarRow,
    TranslateModule,
    MatCardContent,
    UiSearchDirective,
    IxTableComponent,
    IxTableBodyComponent,
    IxTableHeadComponent,
    IxTablePagerComponent,
    IxTableEmptyDirective,
    SearchInput1Component,
  ],
})
export class FibreChannelPortsComponent implements OnInit {
  protected readonly searchableElements = fibreChannelPortsElements;
  protected searchQuery = signal<string>('');
  protected dataProvider: AsyncDataProvider<FibreChannelPort>;
  protected isHa = toSignal(this.store$.select(selectIsHaLicensed));

  protected status = toSignal(this.api.call('fcport.status').pipe(shareReplay({
    refCount: false,
    bufferSize: 1,
  })));

  protected columns = createTable<FibreChannelPort>([
    textColumn({
      title: this.translate.instant('Port'),
      propertyName: 'port',
      getValue: (row) => {
        return row.port;
      },
    }),
    textColumn({
      title: this.translate.instant('Target'),
      propertyName: 'target',
      getValue: (row) => {
        return row.target.iscsi_target_name;
      },
    }),
    textColumn({
      title: this.translate.instant('WWPN'),
      propertyName: 'wwpn',
    }),
    textColumn({
      title: this.translate.instant('WWPN (B)'),
      propertyName: 'wwpn_b',
      hidden: !this.isHa(),
    }),
    textColumn({
      title: this.translate.instant('State'),
      getValue: (row) => {
        const status = this.status()?.find((item) => item.port === row.port);
        return `A:${status?.A?.port_state} B:${status?.B?.port_state}`;
      },
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('edit'),
          tooltip: this.translate.instant('Edit'),
          onClick: (row) => this.doEdit(row),
        }, {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.doDelete(row),
        },
      ],
    }),
  ], {
    uniqueRowTag: (row: FibreChannelPort) => 'fibre-channel-port-' + row.port,
    ariaLabels: (row) => [row.port, this.translate.instant('Fibre Channel Port')],
  });

  constructor(
    private api: ApiService,
    private translate: TranslateService,
    private slideIn: SlideInService,
    private store$: Store<AppState>,
    private dialog: DialogService,
    protected emptyService: EmptyService,
  ) { }

  ngOnInit(): void {
    this.dataProvider = new AsyncDataProvider(this.api.call('fcport.query'));
    this.dataProvider.load();
  }

  onAdd(): void {
    this.slideIn.open(FibreChannelPortsFormComponent);
  }

  doEdit(port: FibreChannelPort): void {
    this.slideIn.open(FibreChannelPortsFormComponent, { data: port });
  }

  doDelete(port: FibreChannelPort): void {
    this.dialog.confirm({
      title: this.translate.instant('Delete Fibre Channel Port'),
      message: this.translate.instant('Are you sure you want to delete Fibre Channel Port {port}?', { port: port.port }),
      buttonText: this.translate.instant('Delete'),
      cancelText: this.translate.instant('Cancel'),
    }).pipe(
      filter(Boolean),
      switchMap(() => this.api.call('fcport.delete', [port.id])),
      untilDestroyed(this),
    ).subscribe(() => {
      this.dataProvider.load();
    });
  }

  onSearch(query: string): void {
    this.searchQuery.set(query);
  }
}
