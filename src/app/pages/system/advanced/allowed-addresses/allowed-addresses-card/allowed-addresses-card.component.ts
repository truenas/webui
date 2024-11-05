import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  filter, map, switchMap, tap,
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
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TooltipComponent } from 'app/modules/tooltip/tooltip.component';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { allowedAddressesCardElements } from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-card/allowed-addresses-card.elements';
import {
  AllowedAddressesFormComponent,
} from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-form/allowed-addresses-form.component';
import { ChainedSlideInService } from 'app/services/chained-slide-in.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { generalConfigUpdated } from 'app/store/system-config/system-config.actions';

interface AllowedAddressRow {
  address: string;
}

@UntilDestroy()
@Component({
  selector: 'ix-allowed-addresses-card',
  styleUrls: ['../../common-card.scss', './allowed-addresses-card.component.scss'],
  templateUrl: './allowed-addresses-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
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
  protected readonly searchableElements = allowedAddressesCardElements;
  protected readonly requiredRoles = [Role.FullAdmin];
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
          requiredRoles: [Role.FullAdmin],
        },
      ],
    }),
  ], {
    uniqueRowTag: (row) => 'allowed-address-' + row.address,
    ariaLabels: (row) => [row.address, this.translate.instant('Allowed Address')],
  });

  constructor(
    private ws: WebSocketService,
    private store$: Store<AppState>,
    private dialog: DialogService,
    private chainedSlideIns: ChainedSlideInService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private advancedSettings: AdvancedSettingsService,
    protected emptyService: EmptyService,
  ) {}

  ngOnInit(): void {
    const config$ = this.ws.call('system.general.config').pipe(
      map((config) => this.getAddressesSourceFromConfig(config)),
      untilDestroyed(this),
    );
    this.dataProvider = new AsyncDataProvider<AllowedAddressRow>(config$);
    this.getAllowedAddresses();
  }

  onConfigure(): void {
    this.advancedSettings.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.chainedSlideIns.open(AllowedAddressesFormComponent)),
      filter((response) => !!response.response),
      tap(() => {
        this.getAllowedAddresses();
      }),
      untilDestroyed(this),
    ).subscribe();
  }

  promptDeleteAllowedAddress(row: AllowedAddressRow): void {
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
        error: (err: unknown) => this.dialog.error(this.errorHandler.parseError(err)),
      });
  }

  private deleteAllowedAddress(row: AllowedAddressRow): void {
    this.dataProvider.currentPage$.pipe(
      switchMap((currentPage) => {
        const updatedAddresses = currentPage.filter((ip) => ip.address !== row.address).map((ip) => ip.address);
        return this.ws.call('system.general.update', [{ ui_allowlist: updatedAddresses }]);
      }),
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.store$.dispatch(generalConfigUpdated());
        this.getAllowedAddresses();
      },
      error: (err: unknown) => this.dialog.error(this.errorHandler.parseError(err)),
    });
  }

  private getAllowedAddresses(): void {
    this.dataProvider.load();
  }

  private getAddressesSourceFromConfig(data: SystemGeneralConfig): AllowedAddressRow[] {
    return data.ui_allowlist.map((ip) => ({ address: ip }));
  }
}
