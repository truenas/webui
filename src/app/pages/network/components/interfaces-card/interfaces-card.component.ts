import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnInit,
  Output,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { NetworkInterfaceType } from 'app/enums/network-interface.enum';
import helptext from 'app/helptext/network/interfaces/interfaces-list';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { AllNetworkInterfacesUpdate } from 'app/interfaces/reporting.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import {
  IpAddressesCellComponent,
} from 'app/pages/network/components/interfaces-card/ip-addresses-cell/ip-addresses-cell.component';
import { InterfacesStore } from 'app/pages/network/stores/interfaces.store';
import {
  AppLoaderService, DialogService, NetworkService, WebSocketService,
} from 'app/services';
import { CoreService } from 'app/services/core-service/core.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

@UntilDestroy()
@Component({
  selector: 'ix-interfaces-card',
  templateUrl: './interfaces-card.component.html',
  styleUrls: ['./interfaces-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InterfacesCardComponent implements OnInit {
  @Input() isHaEnabled = false;
  @Output() interfacesUpdated = new EventEmitter<void>();

  isLoading = false;
  dataProvider = new ArrayDataProvider<NetworkInterface>();
  inOutUpdates: AllNetworkInterfacesUpdate;

  columns = createTable<NetworkInterface>([
    textColumn({
      // In-out column
      propertyName: 'state',
    }),
    textColumn({
      title: this.translate.instant('Name'),
      propertyName: 'name',
    }),
    {
      type: IpAddressesCellComponent,
      title: this.translate.instant('IP Addresses'),
    },
    textColumn({
      propertyName: 'id',
    }),
  ]);

  readonly helptext = helptext;

  constructor(
    private store: InterfacesStore,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private slideIn: IxSlideInService,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private core: CoreService,
    private errorHandler: ErrorHandlerService,
    private networkService: NetworkService,
  ) {}

  isPhysical(row: NetworkInterface): boolean {
    return row.type === NetworkInterfaceType.Physical;
  }

  ngOnInit(): void {
    this.store.loadInterfaces();
    this.subscribeToUpdates();
    this.store.state$.pipe(untilDestroyed(this)).subscribe((state) => {
      this.isLoading = state.isLoading;
      this.dataProvider.setRows(state.interfaces);
      this.cdr.markForCheck();
    });
  }

  onAddNew(): void {
    this.slideIn.open(InterfaceFormComponent)
      .slideInClosed$
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.interfacesUpdated.emit();
        this.store.loadInterfaces();
      });
  }

  onEdit(row: NetworkInterface): void {
    this.slideIn.open(InterfaceFormComponent, {
      data: row,
    })
      .slideInClosed$
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.interfacesUpdated.emit();
        this.store.loadInterfaces();
      });
  }

  onDelete(row: NetworkInterface): void {
    this.dialogService.confirm({
      title: this.translate.instant('Delete Interface'),
      message: this.translate.instant(helptext.delete_dialog_text),
      buttonText: this.translate.instant('Delete'),
    })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.makeDeleteCall(row));
  }

  onReset(row: NetworkInterface): void {
    this.dialogService.confirm({
      title: this.translate.instant('Reset Configuration'),
      message: this.translate.instant(helptext.delete_dialog_text),
      buttonText: this.translate.instant('Reset'),
    })
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => this.makeDeleteCall(row));
  }

  private makeDeleteCall(row: NetworkInterface): void {
    this.loader.open();
    this.ws.call('interface.delete', [row.id]).pipe(untilDestroyed(this)).subscribe({
      next: () => {
        this.loader.close();
        this.interfacesUpdated.emit();
        this.store.loadInterfaces();
        this.core.emit({ name: 'NetworkInterfacesChanged', data: { commit: false, checkin: false }, sender: this });
      },
      error: (error) => {
        this.dialogService.error(this.errorHandler.parseWsError(error));
        this.loader.close();
      },
    });
  }

  private subscribeToUpdates(): void {
    this.networkService.subscribeToInOutUpdates().pipe(untilDestroyed(this)).subscribe((updates) => {
      this.inOutUpdates = updates;
      this.cdr.markForCheck();
    });
  }
}
