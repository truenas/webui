import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatDialog } from '@angular/material/dialog';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardHeaderDirective,
  TnCellDefDirective, TnHeaderCellDefDirective, TnTableColumnDirective, TnTableComponent, tnIconMarker,
} from '@truenas/ui-components';
import { of } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { WINDOW } from 'app/helpers/window.helper';
import { Ipmi } from 'app/interfaces/ipmi.interface';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { convertStringToId } from 'app/modules/ix-table/utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  ShareActionsCellComponent,
} from 'app/pages/sharing/components/shares-dashboard/cells/share-actions-cell/share-actions-cell.component';
import { ipmiCardElements } from 'app/pages/system/network/components/ipmi-card/ipmi-card.elements';
import {
  IpmiEventsDialog,
} from 'app/pages/system/network/components/ipmi-card/ipmi-events-dialog/ipmi-events-dialog.component';
import { IpmiFormComponent } from 'app/pages/system/network/components/ipmi-card/ipmi-form/ipmi-form.component';

@Component({
  selector: 'ix-ipmi-card',
  templateUrl: './ipmi-card.component.html',
  styleUrls: ['./ipmi-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    ShareActionsCellComponent,
    UiSearchDirective,
    TranslateModule,
    AsyncPipe,
  ],
})
export class IpmiCardComponent implements OnInit {
  private api = inject(ApiService);
  private slideIn = inject(SlideIn);
  private matDialog = inject(MatDialog);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private window = inject<Window>(WINDOW);

  protected readonly searchableElements = ipmiCardElements.elements;
  protected dataProvider: AsyncDataProvider<Ipmi>;
  protected readonly displayedColumns = ['channel', 'actions'];

  protected readonly actions: IconActionConfig<Ipmi>[] = [
    {
      iconName: tnIconMarker('pencil', 'mdi'),
      tooltip: this.translate.instant('Edit'),
      onClick: (row) => this.onEdit(row),
    },
    {
      hidden: (row) => of(!this.canOpen(row)),
      iconName: tnIconMarker('open-in-new', 'mdi'),
      tooltip: this.translate.instant('Open'),
      onClick: (row) => this.onOpen(row),
    },
  ];

  protected uniqueRowTag(row: Ipmi): string {
    return convertStringToId(`ipmi-${row.channel}-${row.ip_address}`);
  }

  protected ariaLabel(row: Ipmi): string {
    return [row.ip_address, this.translate.instant('IPMI')].join(' ');
  }

  protected readonly hasIpmi$ = this.api.call('ipmi.is_loaded');

  ngOnInit(): void {
    const ipmi$ = this.api.call('ipmi.lan.query').pipe(takeUntilDestroyed(this.destroyRef));
    this.dataProvider = new AsyncDataProvider<Ipmi>(ipmi$);
    this.loadIpmiEntries();
  }

  private canOpen(ipmi: Ipmi): boolean {
    return ipmi.ip_address !== '0.0.0.0';
  }

  onEdit(ipmi: Ipmi): void {
    this.slideIn.open(IpmiFormComponent, { data: ipmi.id }).onSuccess(() => this.loadIpmiEntries(), this.destroyRef);
  }

  private onOpen(ipmi: Ipmi): void {
    this.window.open(`https://${ipmi.ip_address}`);
  }

  onOpenEvents(): void {
    this.matDialog.open(IpmiEventsDialog);
  }

  private loadIpmiEntries(): void {
    this.dataProvider.load();
  }
}
