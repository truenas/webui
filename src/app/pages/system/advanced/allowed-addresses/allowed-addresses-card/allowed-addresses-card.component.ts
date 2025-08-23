import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, map, switchMap, tap, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { EmptyService } from 'app/modules/empty/empty.service';
import { iconMarker } from 'app/modules/ix-icon/icon-marker.util';
import { AsyncDataProvider } from 'app/modules/ix-table/classes/async-data-provider/async-data-provider';
import { IxTableComponent } from 'app/modules/ix-table/components/ix-table/ix-table.component';
import { actionsColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { IxTableBodyComponent } from 'app/modules/ix-table/components/ix-table-body/ix-table-body.component';
import { IxTableHeadComponent } from 'app/modules/ix-table/components/ix-table-head/ix-table-head.component';
import { IxTableEmptyDirective } from 'app/modules/ix-table/directives/ix-table-empty.directive';
import { createTable } from 'app/modules/ix-table/utils';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
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

@UntilDestroy()
@Component({
  selector: 'ix-allowed-addresses-card',
  styleUrls: ['../../../general-settings/common-settings-card.scss', './allowed-addresses-card.component.scss'],
  templateUrl: './allowed-addresses-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    TooltipComponent,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    IxTableComponent,
    IxTableEmptyDirective,
    IxTableHeadComponent,
    IxTableBodyComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class AllowedAddressesCardComponent implements OnInit {
  private api = inject(ApiService);
  private store$ = inject<Store<AppState>>(Store);
  private dialog = inject(DialogService);
  private slideIn = inject(SlideIn);
  private errorHandler = inject(ErrorHandlerService);
  private translate = inject(TranslateService);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private systemGeneralService = inject(SystemGeneralService);
  protected emptyService = inject(EmptyService);

  protected readonly searchableElements = allowedAddressesCardElements;
  protected readonly requiredRoles = [Role.SystemGeneralWrite];
  protected isDeleting = signal(false);
  protected isDeleting$ = toObservable(this.isDeleting);
  dataProvider: AsyncDataProvider<AllowedAddressRow>;

  columns = createTable<AllowedAddressRow>([
    textColumn({
      title: this.translate.instant('Address'),
      propertyName: 'address',
    }),
    actionsColumn({
      actions: [
        {
          iconName: iconMarker('mdi-delete'),
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.promptDeleteAllowedAddress(row),
          requiredRoles: [Role.SystemGeneralWrite],
          disabled: () => this.isDeleting$,
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'allowed-address-' + row.address,
    ariaLabels: (row) => [row.address, this.translate.instant('Allowed Address')],
  });

  ngOnInit(): void {
    const config$ = this.api.call('system.general.config').pipe(
      map((config) => this.getAddressesSourceFromConfig(config)),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<AllowedAddressRow>(config$);
    this.getAllowedAddresses();
  }

  onConfigure(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.slideIn.open(AllowedAddressesFormComponent)),
      filter((response) => !!response.response),
      tap(() => {
        this.getAllowedAddresses();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  private promptDeleteAllowedAddress(row: AllowedAddressRow): void {
    this.dialog
      .confirm({
        title: this.translate.instant('Delete Allowed Address'),
        message: this.translate.instant('Are you sure you want to delete address {ip}?', { ip: row.address }),
      })
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
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
      untilDestroyed(this),
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
