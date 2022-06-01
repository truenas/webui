import {
  AfterViewInit, Component, Input, OnDestroy,
} from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  differenceInSeconds, differenceInDays, addSeconds, format,
} from 'date-fns';
import { JobState } from 'app/enums/job-state.enum';
import { ProductType } from 'app/enums/product-type.enum';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { HaStatusEvent } from 'app/interfaces/events/ha-status-event.interface';
import { UpdateCheckedEvent } from 'app/interfaces/events/update-checked-event.interface';
import { UserPreferencesChangedEvent } from 'app/interfaces/events/user-preferences-event.interface';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { Timeout } from 'app/interfaces/timeout.interface';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import { SystemGeneralService, WebSocketService } from 'app/services';
import { LocaleService } from 'app/services/locale.service';

@UntilDestroy()
@Component({
  selector: 'widget-sysinfo',
  templateUrl: './widget-sys-info.component.html',
  styleUrls: ['./widget-sys-info.component.scss'],
})
export class WidgetSysInfoComponent extends WidgetComponent implements OnDestroy, AfterViewInit {
  // HA
  @Input() isHA = false;
  @Input() isPassive = false;
  @Input() enclosureSupport = false;
  @Input() showReorderHandle = false;
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
  retroLogo = -1;
  product_image = '';
  product_model = '';
  product_enclosure = ''; // rackmount || tower
  certified = false;
  failoverBtnLabel = 'FAILOVER TO STANDBY';
  updateAvailable = false;
  private _updateBtnStatus = 'default';
  private _themeAccentColors: string[];
  manufacturer = '';
  buildDate: string;
  loader = false;
  product_type = window.localStorage['product_type'] as ProductType;
  isFN = false;
  isUpdateRunning = false;
  is_ha: boolean;
  ha_status: string;
  updateMethod = 'update.update';
  screenType = 'Desktop';
  uptimeString: string;
  dateTime: string;

  readonly ProductType = ProductType;

  constructor(public router: Router, public translate: TranslateService, private ws: WebSocketService,
    public sysGenService: SystemGeneralService, public mediaObserver: MediaObserver,
    private locale: LocaleService) {
    super(translate);
    this.configurable = false;
    this.sysGenService.updateRunning.pipe(untilDestroyed(this)).subscribe((res: string) => {
      this.isUpdateRunning = res === 'true';
    });

    mediaObserver.media$.pipe(untilDestroyed(this)).subscribe((evt) => {
      const st = evt.mqAlias == 'xs' ? 'Mobile' : 'Desktop';
      this.screenType = st;
    });
  }

  ngAfterViewInit(): void {
    this.core.register({ observerClass: this, eventName: 'UserPreferencesChanged' }).pipe(untilDestroyed(this)).subscribe((evt: UserPreferencesChangedEvent) => {
      this.retroLogo = evt.data.retroLogo ? 1 : 0;
    });

    this.ws.call('update.get_auto_download').pipe(untilDestroyed(this)).subscribe((isAutoDownloadOn) => {
      if (!isAutoDownloadOn) {
        return;
      }

      this.core.register({ observerClass: this, eventName: 'UpdateChecked' }).pipe(untilDestroyed(this)).subscribe((evt: UpdateCheckedEvent) => {
        if (evt.data.status == SystemUpdateStatus.Available) {
          this.updateAvailable = true;
          sessionStorage.updateAvailable = 'true';
        } else {
          this.updateAvailable = false;
          sessionStorage.updateAvailable = 'false';
        }
      });
    });

    if (this.isHA && this.isPassive) {
      this.core.register({ observerClass: this, eventName: 'HA_Status' }).pipe(untilDestroyed(this)).subscribe((evt: HaStatusEvent) => {
        if (evt.data.status == 'HA Enabled' && !this.data) {
          this.ws.call('failover.call_remote', ['system.info']).pipe(untilDestroyed(this)).subscribe((systemInfo: SystemInfo) => {
            this.processSysInfo(systemInfo);
          });
        }
        this.ha_status = evt.data.status;
      });
    } else {
      this.ws.call('system.info').pipe(untilDestroyed(this)).subscribe((systemInfo) => {
        this.processSysInfo(systemInfo);
      });

      /**
       * limit the check to once a day
       */
      if (
        sessionStorage.updateLastChecked
        && Number(sessionStorage.updateLastChecked) + 24 * 60 * 60 * 1000 > Date.now()
      ) {
        if (sessionStorage.updateAvailable == 'true') {
          this.updateAvailable = true;
        } else {
          this.updateAvailable = false;
        }
      } else {
        sessionStorage.updateLastChecked = Date.now();
        sessionStorage.updateAvailable = 'false';
        this.core.emit({ name: 'UpdateCheck' });
      }

      this.core.emit({ name: 'UserPreferencesRequest' });
      this.core.emit({ name: 'HAStatusRequest' });
    }
    if (window.localStorage.getItem('product_type').includes(ProductType.Enterprise)) {
      this.ws.call('failover.licensed').pipe(untilDestroyed(this)).subscribe((hasFailover) => {
        if (hasFailover) {
          this.updateMethod = 'failover.upgrade';
          this.is_ha = true;
        }
        this.checkForRunningUpdate();
      });
    }
  }

  checkForRunningUpdate(): void {
    this.ws.call('core.get_jobs', [[['method', '=', this.updateMethod], ['state', '=', JobState.Running]]]).pipe(untilDestroyed(this)).subscribe(
      (jobs) => {
        if (jobs && jobs.length > 0) {
          this.isUpdateRunning = true;
        }
      },
      (err) => {
        console.error(err);
      },
    );
  }

  ngOnDestroy(): void {
    this.core.unregister({ observerClass: this });
    if (this.timeInterval) {
      clearInterval(this.timeInterval);
    }
  }

  get themeAccentColors(): string[] {
    const theme = this.themeService.currentTheme();
    this._themeAccentColors = theme.accentColors.map((color) => theme[color]);
    return this._themeAccentColors;
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

  processSysInfo(systemInfo: SystemInfo): void {
    this.loader = false;
    this.data = systemInfo;
    const now = Date.now();
    const datetime = systemInfo.datetime.$date;
    this.nasDateTime = new Date(datetime);
    this.timeDiffInSeconds = differenceInSeconds(datetime, now);
    this.timeDiffInDays = differenceInDays(datetime, now);
    if (this.timeDiffInSeconds > 300 || this.timeDiffInDays > 0) {
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
    this.buildDate = month + ' ' + day + ', ' + year + ' ' + hours + ':' + minutes;

    this.memory = this.formatMemory(this.data.physmem, 'GiB');

    // PLATFORM INFO
    if (this.data.system_manufacturer && this.data.system_manufacturer.toLowerCase() == 'ixsystems') {
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
    const seconds = Math.round(this.data.uptime_seconds);
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

    this.dateTime = (this.locale.getTimeOnly(this.data.datetime.$date, false, this.data.timezone));
  }

  formatMemory(physmem: number, units: string): string {
    let result: string;
    if (units == 'MiB') {
      result = Number(physmem / 1024 / 1024).toFixed(0) + ' MiB';
    } else if (units == 'GiB') {
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
      this.setTrueNasImage(data.system_product);
    }
  }

  setTrueNasImage(sysProduct: string): void {
    this.product_enclosure = 'rackmount';

    if (sysProduct.includes('X10')) {
      this.product_image = '/servers/X10.png';
      this.product_model = 'X10';
    } else if (sysProduct.includes('X20')) {
      this.product_image = '/servers/X20.png';
      this.product_model = 'X20';
    } else if (sysProduct.includes('M30')) {
      this.product_image = '/servers/M30.png';
      this.product_model = 'M30';
    } else if (sysProduct.includes('M40')) {
      this.product_image = '/servers/M40.png';
      this.product_model = 'M40';
    } else if (sysProduct.includes('M50')) {
      this.product_image = '/servers/M50.png';
      this.product_model = 'M50';
    } else if (sysProduct.includes('M60')) {
      this.product_image = '/servers/M50.png';
      this.product_model = 'M50';
    } else if (sysProduct.includes('Z20')) {
      this.product_image = '/servers/Z20.png';
      this.product_model = 'Z20';
    } else if (sysProduct.includes('Z35')) {
      this.product_image = '/servers/Z35.png';
      this.product_model = 'Z35';
    } else if (sysProduct.includes('Z50')) {
      this.product_image = '/servers/Z50.png';
      this.product_model = 'Z50';
    } else if (sysProduct.includes('R10')) {
      this.product_image = '/servers/R10.png';
      this.product_model = 'R10';
    } else if (sysProduct.includes('R20')) {
      this.product_image = '/servers/R20.png';
      this.product_model = 'R20';
    } else if (sysProduct.includes('R40')) {
      this.product_image = '/servers/R40.png';
      this.product_model = 'R40';
    } else if (sysProduct.includes('R50')) {
      this.product_image = '/servers/R50.png';
      this.product_model = 'R50';
    } else {
      this.product_image = 'ix-original.svg';
    }
  }

  setMiniImage(sysProduct: string): void {
    this.product_enclosure = 'tower';

    if (sysProduct && sysProduct.includes('CERTIFIED')) {
      this.product_image = '';
      this.certified = true;
      return;
    }

    switch (sysProduct) {
      case 'FREENAS-MINI-2.0':
      case 'FREENAS-MINI-3.0-E':
      case 'FREENAS-MINI-3.0-E+':
      case 'TRUENAS-MINI-3.0-E':
      case 'TRUENAS-MINI-3.0-E+':
        this.product_image = 'freenas_mini_cropped.png';
        break;
      case 'FREENAS-MINI-3.0-X':
      case 'FREENAS-MINI-3.0-X+':
      case 'TRUENAS-MINI-3.0-X':
      case 'TRUENAS-MINI-3.0-X+':
        this.product_image = 'freenas_mini_x_cropped.png';
        break;
      case 'FREENAS-MINI-XL':
      case 'FREENAS-MINI-3.0-XL+':
      case 'TRUENAS-MINI-3.0-XL+':
        this.product_image = 'freenas_mini_xl_cropped.png';
        break;
      default:
        this.product_image = '';
        break;
    }
  }

  goToEnclosure(): void {
    if (this.enclosureSupport) this.router.navigate(['/system/viewenclosure']);
  }
}
