import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { filter, map } from 'rxjs';
import { ProductEnclosure } from 'app/enums/product-enclosure.enum';
import { Role } from 'app/enums/role.enum';
import { helptextSystemFailover } from 'app/helptext/system/failover';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { WidgetResourcesService } from 'app/pages/dashboard/services/widget-resources.service';
import { SlotSize } from 'app/pages/dashboard/types/widget.interface';
import { getServerProduct, getProductImage } from 'app/pages/dashboard/widgets/system/common/widget-sys-info.utils';
import { AppState } from 'app/store';
import { selectCanFailover, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectIsIxHardware, selectIsEnterprise, selectEnclosureSupport } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-widget-sys-info-passive',
  templateUrl: './widget-sys-info-passive.component.html',
  styleUrls: ['../common/widget-sys-info.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class WidgetSysInfoPassiveComponent {
  size = input.required<SlotSize>();

  updateAvailable = toSignal(this.resources.updateAvailable$);
  isIxHardware = toSignal(this.store$.select(selectIsIxHardware));
  isEnterprise = toSignal(this.store$.select(selectIsEnterprise));
  isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  hasEnclosureSupport = toSignal(this.store$.select(selectEnclosureSupport));

  systemInfo = toSignal(this.resources.systemInfo$.pipe(map((sysInfo) => sysInfo.remote_info)));

  product = computed(() => {
    if (!this.systemInfo()?.system_product) {
      return '';
    }
    return getServerProduct(this.systemInfo().system_product);
  });

  productImage = computed(() => {
    if (!this.systemInfo()?.system_product) {
      return '';
    }
    return getProductImage(this.systemInfo().system_product);
  });

  productEnclosure = computed(() => {
    if (!this.hasEnclosureSupport()) {
      return null;
    }
    // TODO: Update
    return ProductEnclosure.Rackmount;
  });

  isCertified = computed(() => {
    return this.systemInfo()?.system_product?.includes('CERTIFIED');
  });

  isUnsupportedHardware = computed(() => {
    return this.isEnterprise() && !this.productImage() && !this.isIxHardware();
  });

  systemVersion = computed(() => {
    if (this.systemInfo()?.codename) {
      this.systemInfo().version.replace('TrueNAS-SCALE', this.systemInfo().codename);
    }
    return this.systemInfo()?.version;
  });

  protected readonly isDisabled$ = this.store$.select(selectCanFailover).pipe(map((canFailover) => !canFailover));
  protected readonly requiredRoles = [Role.FailoverWrite];

  constructor(
    private resources: WidgetResourcesService,
    private dialog: DialogService,
    private store$: Store<AppState>,
    private router: Router,
  ) {}

  openDialog(): void {
    this.dialog.confirm({
      title: helptextSystemFailover.dialog_initiate_failover_title,
      message: helptextSystemFailover.dialog_initiate_failover_message,
      buttonText: helptextSystemFailover.dialog_initiate_action,
    }).pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.router.navigate(['/others/failover'], { skipLocationChange: true });
    });
  }

  goToEnclosure(): void {
    if (!this.hasEnclosureSupport()) {
      return;
    }
    this.router.navigate(['/system/oldviewenclosure']);
  }
}
