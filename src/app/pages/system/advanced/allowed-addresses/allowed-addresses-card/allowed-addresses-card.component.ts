import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
  TnCellDefDirective, TnEmptyComponent, TnHeaderCellDefDirective,
  TnTableColumnDirective, TnTableComponent, tnIconMarker,
} from '@truenas/ui-components';
import {
  filter, map, switchMap, tap, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IconActionConfig } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/icon-action-config.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import {
  TableActionsCellComponent,
} from 'app/modules/tn-table-cells/actions-cell/table-actions-cell.component';
import { ApiService } from 'app/modules/websocket/api.service';
import { allowedAddressesCardElements } from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-card/allowed-addresses-card.elements';
import {
  AllowedAddressesFormComponent,
} from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-form/allowed-addresses-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';

interface AllowedAddressRow {
  address: string;
}

@Component({
  selector: 'ix-allowed-addresses-card',
  templateUrl: './allowed-addresses-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    TnTableComponent,
    TnTableColumnDirective,
    TnHeaderCellDefDirective,
    TnCellDefDirective,
    TnEmptyComponent,
    TableActionsCellComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class AllowedAddressesCardComponent implements OnInit {
  private api = inject(ApiService);
  private store$ = inject<Store<AppState>>(Store);
  private dialog = inject(DialogService);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private systemGeneralService = inject(SystemGeneralService);
  private formPanel = inject(FormSidePanelService);
  protected emptyService = inject(EmptyService);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = allowedAddressesCardElements;
  protected readonly requiredRoles = [Role.SystemGeneralWrite];
  protected isDeleting = signal(false);
  protected isDeleting$ = toObservable(this.isDeleting);
  dataProvider: AsyncDataProvider<AllowedAddressRow>;

  protected readonly displayedColumns = ['address', 'actions'];

  protected readonly actions: IconActionConfig<AllowedAddressRow>[] = [
    {
      iconName: tnIconMarker('delete', 'mdi'),
      tooltip: this.translate.instant('Delete'),
      onClick: (row) => this.promptDeleteAllowedAddress(row),
      requiredRoles: [Role.SystemGeneralWrite],
      disabled: () => this.isDeleting$,
    },
  ];

  protected uniqueRowTag(row: AllowedAddressRow): string {
    return 'allowed-address-' + row.address;
  }

  protected ariaLabel(row: AllowedAddressRow): string {
    return [row.address, this.translate.instant('Allowed Address')].join(' ');
  }

  protected trackByAddress(_: number, row: AllowedAddressRow): string {
    return row.address;
  }

  ngOnInit(): void {
    const config$ = this.api.call('system.general.config').pipe(
      map((config) => this.getAddressesSourceFromConfig(config)),
      takeUntilDestroyed(this.destroyRef),
    );
    this.dataProvider = new AsyncDataProvider<AllowedAddressRow>(config$);
    this.getAllowedAddresses();
  }

  onConfigure(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.formPanel.open(AllowedAddressesFormComponent, {
        title: this.translate.instant('Allowed IP Addresses'),
      }).onSuccess(() => this.getAllowedAddresses(), this.destroyRef);
    });
  }

  private promptDeleteAllowedAddress(row: AllowedAddressRow): void {
    this.dialog
      .confirm({
        title: this.translate.instant('Delete Allowed Address'),
        message: this.translate.instant('Are you sure you want to delete address {ip}?', { ip: row.address }),
        buttonColor: 'warn',
      })
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      ).subscribe({
        next: () => this.deleteAllowedAddress(row),
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
      });
  }

  private deleteAllowedAddress(row: AllowedAddressRow): void {
    this.isDeleting.set(true);

    // Get current data once to avoid observable loop
    this.dataProvider.currentPage$.pipe(
      take(1),
      switchMap((currentPage: AllowedAddressRow[]) => {
        const updatedAddresses = currentPage
          .filter((ip: AllowedAddressRow) => ip.address !== row.address)
          .map((ip: AllowedAddressRow) => ip.address);
        return this.api.call('system.general.update', [{ ui_allowlist: updatedAddresses }]);
      }),
      tap(() => {
        this.store$.dispatch(generalConfigUpdated());
      }),
      switchMap(() => this.systemGeneralService.handleUiServiceRestart()),
      tap(() => {
        this.getAllowedAddresses();
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.isDeleting.set(false);
      },
      error: (error: unknown) => {
        this.isDeleting.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private getAllowedAddresses(): void {
    this.dataProvider.load();
  }

  private getAddressesSourceFromConfig(data: SystemGeneralConfig): AllowedAddressRow[] {
    return data.ui_allowlist.map((ip) => ({ address: ip }));
  }
}
