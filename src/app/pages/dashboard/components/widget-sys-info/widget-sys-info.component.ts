import {
  Component, Inject, Input, OnInit,
} from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { filter, take } from 'rxjs/operators';
import { GiB, MiB } from 'app/constants/bytes.constant';
import { JobState } from 'app/enums/job-state.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { ScreenType } from 'app/enums/screen-type.enum';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import {
  AppLoaderService, DialogService, SystemGeneralService,
} from 'app/services';
import { LocaleService } from 'app/services/locale.service';
import { ProductImageService } from 'app/services/product-image.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectHasOnlyMissmatchVersionsReason, selectHaStatus, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectIsIxHardware, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-widget-sysinfo',
  templateUrl: './widget-sys-info.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './widget-sys-info.component.scss',
  ],
})
export class WidgetSysInfoComponent extends WidgetComponent implements OnInit {
  // HA
  @Input() isHaLicensed = false;
  @Input() isPassive = false;
  @Input() enclosureSupport = false;
  @Input() showReorderHandle = false;
  @Input() systemInfo: SystemInfo;

  hasOnlyMismatchVersionsReason$ = this.store$.select(selectHasOnlyMissmatchVersionsReason);

  title: string = this.translate.instant('System Info');
  data: SystemInfo;
  memory: string;
  ready = false;
  productImage = '';
  productModel = '';
  productEnclosure = ''; // rackmount || tower
  certified = false;
  updateAvailable = false;
  isIxHardware = false;
  productType = this.sysGenService.getProductType();
  isUpdateRunning = false;
  hasHa: boolean;
  updateMethod = 'update.update';
  screenType = ScreenType.Desktop;
  uptimeString: string;
  dateTime: string;

  readonly ProductType = ProductType;
  readonly ScreenType = ScreenType;

  private _updateBtnStatus = 'default';

  constructor(
    public router: Router,
    public translate: TranslateService,
    private ws: WebSocketService,
    public sysGenService: SystemGeneralService,
    public mediaObserver: MediaObserver,
    private locale: LocaleService,
    public themeService: ThemeService,
    private store$: Store<AppState>,
    private productImgServ: ProductImageService,
    public loader: AppLoaderService,
    public dialogService: DialogService,
    @Inject(WINDOW) private window: Window,
  ) {
    super(translate);
    this.configurable = false;
    this.sysGenService.updateRunning.pipe(untilDestroyed(this)).subscribe((isUpdateRunning: string) => {
      this.isUpdateRunning = isUpdateRunning === 'true';
    });

    mediaObserver.asObservable().pipe(untilDestroyed(this)).subscribe((changes) => {
      const currentScreenType = changes[0].mqAlias === 'xs' ? ScreenType.Mobile : ScreenType.Desktop;
      this.screenType = currentScreenType;
    });

    this.hasHa = this.window.sessionStorage.getItem('ha_status') === 'true';
  }

  ngOnInit(): void {
    if (this.isHaLicensed && this.isPassive) {
      this.store$.select(selectHaStatus).pipe(
        filter((haStatus) => !!haStatus),
        untilDestroyed(this),
      ).subscribe((haStatus) => {
        if (haStatus.hasHa) {
          this.data = null;

          this.ws.call('failover.call_remote', ['system.info'])
            .pipe(untilDestroyed(this))
            .subscribe((systemInfo: SystemInfo) => {
              this.processSysInfo(systemInfo);
            });
        } else if (!haStatus.hasHa) {
          this.productImage = '';
        }
        this.hasHa = haStatus.hasHa;
      });
    } else {
      this.store$.pipe(waitForSystemInfo, untilDestroyed(this)).subscribe({
        next: (systemInfo) => {
          this.processSysInfo(systemInfo);
        },
        error: (error) => {
          console.error('System Info not available', error);
        },
        complete: () => {
          this.checkForUpdate();
        },
      });
    }
    if (this.sysGenService.getProductType() === ProductType.ScaleEnterprise) {
      this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isHaLicensed) => {
        if (isHaLicensed) {
          this.updateMethod = 'failover.upgrade';
        }
        this.checkForRunningUpdate();
      });
    }
    this.store$.select(selectIsIxHardware).pipe(untilDestroyed(this)).subscribe((isIxHardware) => {
      this.isIxHardware = isIxHardware;
    });
  }

  checkForRunningUpdate(): void {
    this.ws.call('core.get_jobs', [[['method', '=', this.updateMethod], ['state', '=', JobState.Running]]]).pipe(untilDestroyed(this)).subscribe({
      next: (jobs) => {
        if (jobs && jobs.length > 0) {
          this.isUpdateRunning = true;
        }
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  get updateBtnStatus(): string {
    if (this.updateAvailable) {
      this._updateBtnStatus = 'default';
    }
    return this._updateBtnStatus;
  }

  get updateBtnLabel(): string {
    if (this.updateAvailable) {
      return this.translate.instant('Updates Available');
    }
    return this.translate.instant('Check for Updates');
  }

  addTimeDiff(timestamp: number): number {
    if (sessionStorage.systemInfoLoaded) {
      const now = Date.now();
      return timestamp + now - Number(sessionStorage.systemInfoLoaded);
    }
    return timestamp;
  }

  processSysInfo(systemInfo: SystemInfo): void {
    this.data = systemInfo;
    const datetime = this.addTimeDiff(this.data.datetime.$date);
    this.dateTime = this.locale.getTimeOnly(datetime, false, this.data.timezone);

    this.memory = this.formatMemory(this.data.physmem, 'GiB');

    // PRODUCT IMAGE
    this.setProductImage(systemInfo);

    this.parseUptime();
    this.ready = true;
  }

  parseUptime(): void {
    this.uptimeString = '';
    const seconds = Math.round(this.addTimeDiff(this.data.uptime_seconds * 1000) / 1000);
    const uptime = {
      days: Math.floor(seconds / (3600 * 24)),
      hrs: Math.floor(seconds % (3600 * 24) / 3600),
      min: Math.floor(seconds % 3600 / 60),
    };
    const { days, hrs, min } = uptime;

    let pmin = min.toString();
    if (pmin.length === 1) {
      pmin = '0' + pmin;
    }

    // TODO: Replace with ICU strings
    if (days > 0) {
      if (days === 1) {
        this.uptimeString += `${days}${this.translate.instant(' day, ')}`;
      } else {
        this.uptimeString += `${days}${this.translate.instant(' days, ')}${hrs}:${pmin}`;
      }
    } else if (hrs > 0) {
      this.uptimeString += `${hrs}:${pmin}`;
    } else {
      this.uptimeString += this.translate.instant('{minute, plural, one {# minute} other {# minutes}}', { minute: min });
    }
  }

  formatMemory(physmem: number, units: string): string {
    let result: string;
    if (units === 'MiB') {
      result = Number(physmem / MiB).toFixed(0) + ' MiB';
    } else if (units === 'GiB') {
      result = Number(physmem / GiB).toFixed(0) + ' GiB';
    }
    return result;
  }

  setProductImage(data: SystemInfo): void {
    if (!this.isIxHardware) return;

    if (data.system_product.includes('MINI')) {
      this.setMiniImage(data.system_product);
    } else if (data.system_product.includes('CERTIFIED')) {
      this.certified = true;
    } else {
      const product = this.productImgServ.getServerProduct(data.system_product);
      this.productImage = product ? `/servers/${product}.png` : 'ix-original.svg';
      this.productModel = product || '';
      this.productEnclosure = 'rackmount';
    }
  }

  setMiniImage(sysProduct: string): void {
    this.productEnclosure = 'tower';

    if (sysProduct && sysProduct.includes('CERTIFIED')) {
      this.productImage = '';
      this.certified = true;
      return;
    }
    this.productImage = this.productImgServ.getMiniImagePath(sysProduct) || '';
  }

  goToEnclosure(): void {
    if (this.enclosureSupport) this.router.navigate(['/system/viewenclosure']);
  }

  /**
   * limit the check to once a day
   */
  private checkForUpdate(): void {
    const oneDay = 24 * 60 * 60 * 1000;
    if (
      sessionStorage.updateLastChecked
      && Number(sessionStorage.updateLastChecked) + oneDay > Date.now()
    ) {
      this.updateAvailable = sessionStorage.updateAvailable === 'true';
      return;
    }
    sessionStorage.updateLastChecked = Date.now();
    sessionStorage.updateAvailable = 'false';

    this.ws.call('update.check_available').pipe(
      take(1),
      untilDestroyed(this),
    ).subscribe((update) => {
      if (update.status !== SystemUpdateStatus.Available) {
        this.updateAvailable = false;
        sessionStorage.updateAvailable = 'false';
        return;
      }

      this.updateAvailable = true;
      sessionStorage.updateAvailable = 'true';
    });
  }
}
