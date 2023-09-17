import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { WebsocketError } from 'app/interfaces/websocket-error.interface';
import { ArrayDataProvider } from 'app/modules/ix-table2/array-data-provider';
import { textColumn } from 'app/modules/ix-table2/components/ix-table-body/cells/ix-cell-text/ix-cell-text.component';
import { createTable } from 'app/modules/ix-table2/utils';
import { AdvancedSettingsService } from 'app/pages/system/advanced/advanced-settings.service';
import {
  AllowedAddressesFormComponent,
} from 'app/pages/system/advanced/allowed-addresses/allowed-addresses-form/allowed-addresses-form.component';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
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
  dataProvider = new ArrayDataProvider<AllowedAddressRow>();

  isLoading = false;

  columns = createTable<AllowedAddressRow>([
    textColumn({
      title: this.translate.instant('Address'),
      propertyName: 'address',
    }),
    textColumn({
      propertyName: 'address',
    }),
  ]);

  constructor(
    private ws: WebSocketService,
    private store$: Store<AppState>,
    private dialog: DialogService,
    private slideInService: IxSlideInService,
    private errorHandler: ErrorHandlerService,
    private translate: TranslateService,
    private advancedSettings: AdvancedSettingsService,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.getAllowedAddresses();
  }

  async onConfigure(): Promise<void> {
    await this.advancedSettings.showFirstTimeWarningIfNeeded();
    const slideInRef = this.slideInService.open(AllowedAddressesFormComponent);
    slideInRef.slideInClosed$.pipe(untilDestroyed(this)).subscribe(() => {
      this.getAllowedAddresses();
    });
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
        error: (err: WebsocketError) => this.dialog.error(this.errorHandler.parseWsError(err)),
      });
  }

  private deleteAllowedAddress(row: AllowedAddressRow): void {
    const updatedAddresses = this.dataProvider.rows
      .filter((ip) => ip.address !== row.address)
      .map(ip => ip.address);

    this.ws.call('system.general.update', [{ ui_allowlist: updatedAddresses }]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.store$.dispatch(generalConfigUpdated());
        this.getAllowedAddresses();
      },
      error: (err: WebsocketError) => this.dialog.error(this.errorHandler.parseWsError(err)),
    });
  }

  private getAllowedAddresses(): void {
    this.isLoading = true;
    this.ws.call('system.general.config').pipe(untilDestroyed(this)).subscribe((config) => {
      this.dataProvider.setRows(this.getAddressesSourceFromConfig(config));
      this.isLoading = false;
      this.cdr.markForCheck();
    });
  }

  private getAddressesSourceFromConfig(data: SystemGeneralConfig): AllowedAddressRow[] {
    return data.ui_allowlist.map((ip) => ({ address: ip }));
  }
}
