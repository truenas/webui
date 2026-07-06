import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnCardComponent, TnCardHeaderDirective, TnCellDefDirective, TnDialog, TnHeaderCellDefDirective, tnIconMarker, TnTableColumnDirective, TnTableComponent } from '@truenas/ui-components';
import { of } from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { WINDOW } from 'app/helpers/window.helper';
import { Ipmi } from 'app/interfaces/ipmi.interface';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { convertStringToId, dataProviderLoading, dataProviderRows } from 'app/modules/ix-table/utils';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
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
    TableActionsCellComponent,
    UiSearchDirective,
    TranslateModule,
  ],
})
export class IpmiCardComponent implements OnInit {
  private api = inject(ApiService);
  private formPanel = inject(FormSidePanelService);
  private tnDialog = inject(TnDialog);
  private translate = inject(TranslateService);
  private destroyRef = inject(DestroyRef);
  private window = inject<Window>(WINDOW);

  protected readonly searchableElements = ipmiCardElements.elements;

  private readonly ipmi$ = this.api.call('ipmi.lan.query').pipe(takeUntilDestroyed(this.destroyRef));
  protected dataProvider = new AsyncDataProvider<Ipmi>(this.ipmi$);
  protected readonly rows = dataProviderRows(this.dataProvider);
  protected readonly isLoading = dataProviderLoading(this.dataProvider);
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

  protected readonly hasIpmi = toSignal(this.api.call('ipmi.is_loaded'));

  ngOnInit(): void {
    this.loadIpmiEntries();
  }

  private canOpen(ipmi: Ipmi): boolean {
    return ipmi.ip_address !== '0.0.0.0';
  }

  onEdit(ipmi: Ipmi): void {
    this.formPanel.open(IpmiFormComponent, {
      title: this.translate.instant('IPMI'),
      inputs: { editIpmiId: ipmi.id },
    }).onSuccess(() => this.loadIpmiEntries(), this.destroyRef);
  }

  private onOpen(ipmi: Ipmi): void {
    this.window.open(`https://${ipmi.ip_address}`);
  }

  onOpenEvents(): void {
    this.tnDialog.open(IpmiEventsDialog);
  }

  private loadIpmiEntries(): void {
    this.dataProvider.load();
  }
}
