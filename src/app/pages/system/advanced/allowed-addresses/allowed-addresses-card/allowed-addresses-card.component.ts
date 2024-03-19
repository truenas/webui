import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  filter, map, switchMap, tap,
} from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { AsyncDataProvider } from 'app/modules/ix-table2/classes/async-data-provider/async-data-provider';
import { actionsColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-actions/ix-cell-actions.component';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { EmptyService } from 'app/modules/ix-tables/services/empty.service';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import { elements } from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-card/allowed-addresses-card.elements';
import {
  AllowedAddressesFormComponent,
} from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-form/allowed-addresses-form.component';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxChainedSlideInService } from 'app/services/ix-chained-slide-in.service';
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
})
export class AllowedAddressesCardComponent implements OnInit {
  protected readonly searchElements = elements;

  dataProvider: AsyncDataProvider<AllowedAddressRow>;

  columns = createTable<AllowedAddressRow>([
    textColumn({
      title: this.translate.instant('Address'),
      propertyName: 'address',
    }),
    actionsColumn({
      actions: [
        {
          iconName: 'delete',
          tooltip: this.translate.instant('Delete'),
          onClick: (row) => this.promptDeleteAllowedAddress(row),
          requiredRoles: [Role.FullAdmin],
        },
      ],
    }),
  ], {
    rowTestId: (row) => 'allowed-address-' + row.address,
  });

  constructor(
    private ws: WebSocketService,
    private store$: Store<AppState>,
    private dialog: DialogService,
    private chainedSlideIns: IxChainedSlideInService,
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
      switchMap(() => this.chainedSlideIns.pushComponent(AllowedAddressesFormComponent)),
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
