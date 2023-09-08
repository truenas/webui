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
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs/operators';
import { NetworkInterfaceType } from 'app/enums/network-interface.enum';
import helptext from 'app/helptext/network/interfaces/interfaces-list';
import { NetworkInterface } from 'app/interfaces/network-interface.interface';
import { AllNetworkInterfacesUpdate } from 'app/interfaces/reporting.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { InterfaceFormComponent } from 'app/pages/network/components/interface-form/interface-form.component';
import {
  IpAddressesCellComponent,
} from 'app/pages/network/components/interfaces-card/ip-addresses-cell/ip-addresses-cell.component';
import { InterfacesStore } from 'app/pages/network/stores/interfaces.store';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { NetworkService } from 'app/services/network.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { networkInterfacesChanged } from 'app/store/network-interfaces/network-interfaces.actions';

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
    private interfacesStore$: InterfacesStore,
    private store$: Store<AppState>,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private slideInService: IxSlideInService,
    private dialogService: DialogService,
    private ws: WebSocketService,
    private loader: AppLoaderService,
    private errorHandler: ErrorHandlerService,
    private networkService: NetworkService,
  ) {}

  isPhysical(row: NetworkInterface): boolean {
    return row.type === NetworkInterfaceType.Physical;
  }

  ngOnInit(): void {
    this.interfacesStore$.loadInterfaces();
    this.subscribeToUpdates();
    this.interfacesStore$.state$.pipe(untilDestroyed(this)).subscribe((state) => {
      this.isLoading = state.isLoading;
      this.dataProvider.setRows(state.interfaces);
      this.cdr.markForCheck();
    });
  }

  onAddNew(): void {
    this.slideInService.open(InterfaceFormComponent)
      .slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.interfacesUpdated.emit();
        this.interfacesStore$.loadInterfaces();
      });
  }

  onEdit(row: NetworkInterface): void {
    this.slideInService.open(InterfaceFormComponent, {
      data: row,
    })
      .slideInClosed$
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe(() => {
        this.interfacesUpdated.emit();
        this.interfacesStore$.loadInterfaces();
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
    this.ws.call('interface.delete', [row.id])
      .pipe(
        this.loader.withLoader(),
        this.errorHandler.catchError(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.interfacesUpdated.emit();
        this.interfacesStore$.loadInterfaces();
        this.store$.dispatch(networkInterfacesChanged({ commit: false, checkIn: false }));
      });
  }

  private subscribeToUpdates(): void {
    this.networkService.subscribeToInOutUpdates().pipe(untilDestroyed(this)).subscribe((updates) => {
      this.inOutUpdates = updates;
      this.cdr.markForCheck();
    });
  }
}
