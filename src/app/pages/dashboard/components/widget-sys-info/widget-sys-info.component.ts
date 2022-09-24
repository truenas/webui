import {
  Component, Input, OnDestroy, OnInit,
} from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import {
  differenceInSeconds, differenceInDays, addSeconds, format,
} from 'date-fns';
import { filter, take } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { Timeout } from 'app/interfaces/timeout.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { SystemGeneralService, WebSocketService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';
import { ProductImageService } from 'app/services/product-image.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { AppState } from 'app/store';
import { selectHaStatus, waitForSystemInfo } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-widget-sysinfo',
  templateUrl: './widget-sys-info.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './widget-sys-info.component.scss',
  ],
})
export class WidgetSysInfoComponent extends WidgetComponent implements OnInit, OnDestroy {
  // HA
  @Input() isHa = false;
  @Input() isPassive = false;
  @Input() enclosureSupport = false;
  @Input() showReorderHandle = false;
  @Input() systemInfo: SystemInfo;
  showTimeDiffWarning = false;
  timeInterval: Timeout;
  timeDiffInSeconds: number;
  timeDiffInDays: number;
  nasDateTime: Date;

  title: string = this.translate.instant('System Info');
  data: SystemInfo;
  memory: string;
  imagePath = 'assets/images/';
  ready = false;
  productImage = '';
  productModel = '';
  productEnclosure = ''; // rackmount || tower
  certified = false;
  updateAvailable = false;
  private _updateBtnStatus = 'default';
  private _themeAccentColors: string[];
  manufacturer = '';
  buildDate: string;
  loader = false;
  productType = window.localStorage['product_type'] as ProductType;
  isUpdateRunning = false;
  haStatus: string;
  updateMethod = 'update.update';
  screenType = 'Desktop';
  uptimeString: string;
  dateTime: string;

  readonly ProductType = ProductType;

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
  ) {
    super(translate);
    this.configurable = false;
    this.sysGenService.updateRunning.pipe(untilDestroyed(this)).subscribe((res: string) => {
      this.isUpdateRunning = res === 'true';
    });

    mediaObserver.media$.pipe(untilDestroyed(this)).subscribe((evt) => {
      const st = evt.mqAlias === 'xs' ? 'Mobile' : 'Desktop';
      this.screenType = st;
    });
  }

  ngOnInit(): void {
    if (this.isHa && this.isPassive) {
      this.store$.select(selectHaStatus).pipe(
        filter((haStatus) => !!haStatus),
        untilDestroyed(this),
      ).subscribe((haStatus) => {
        if (haStatus.status === 'HA Enabled' && !this.data) {
          this.ws.call('failover.call_remote', ['system.info']).pipe(untilDestroyed(this)).subscribe((systemInfo: SystemInfo) => {
            this.processSysInfo(systemInfo);
          });
        }
        this.haStatus = haStatus.status;
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
      this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((hasFailover) => {
        if (hasFailover) {
          this.updateMethod = 'failover.upgrade';
        }
        this.checkForRunningUpdate();
      });
    }
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

  ngOnDestroy(): void {
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
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

  get timeDiffWarning(): string {
    const nasTimeFormatted = format(this.nasDateTime, 'MMM dd, HH:mm:ss, OOOO');
    return this.translate.instant('Your NAS time {datetime} does not match your computer time.', { datetime: nasTimeFormatted });
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
    const now = Date.now();
    const datetime = this.addTimeDiff(this.data.datetime.$date);
    this.nasDateTime = new Date(datetime);
    this.dateTime = this.locale.getTimeOnly(datetime, false, this.data.timezone);

    this.timeDiffInSeconds = differenceInSeconds(datetime, now);
    this.timeDiffInSeconds = this.timeDiffInSeconds < 0 ? (this.timeDiffInSeconds * -1) : this.timeDiffInSeconds;

    this.timeDiffInDays = differenceInDays(datetime, now);
    this.timeDiffInDays = this.timeDiffInDays < 0 ? (this.timeDiffInDays * -1) : this.timeDiffInDays;

    if (this.timeDiffInSeconds > 300) {
      this.showTimeDiffWarning = true;
    }

    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }

    this.timeInterval = setInterval(() => {
      this.nasDateTime = addSeconds(this.nasDateTime, 1);
    }, 1000);

    const build = new Date(this.data.buildtime['$date']);
    const year = build.getUTCFullYear();
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[build.getUTCMonth()];
    const day = build.getUTCDate();
    const hours = build.getUTCHours();
    const minutes = build.getUTCMinutes();
    this.buildDate = `${month} ${day}, ${year} ${hours}:${minutes}`;

    this.memory = this.formatMemory(this.data.physmem, 'GiB');

    // PLATFORM INFO
    if (this.data.system_manufacturer && this.data.system_manufacturer.toLowerCase() === 'ixsystems') {
      this.manufacturer = 'ixsystems';
    } else {
      this.manufacturer = 'other';
    }

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

    if (days > 0) {
      if (days === 1) {
        this.uptimeString += days + this.translate.instant(' day, ');
      } else {
        this.uptimeString += days + this.translate.instant(' days, ') + `${hrs}:${pmin}`;
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
      result = Number(physmem / 1024 / 1024).toFixed(0) + ' MiB';
    } else if (units === 'GiB') {
      result = Number(physmem / 1024 / 1024 / 1024).toFixed(0) + ' GiB';
    }
    return result;
  }

  setProductImage(data: SystemInfo): void {
    if (this.manufacturer !== 'ixsystems') return;

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
