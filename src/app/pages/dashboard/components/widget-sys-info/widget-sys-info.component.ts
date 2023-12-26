import { TitleCasePipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component, Inject, Input, OnInit,
} from '@angular/core';
import { MediaObserver } from '@angular/flex-layout';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService } from '@ngx-translate/core';
import { take } from 'rxjs/operators';
import { JobState } from 'app/enums/job-state.enum';
import { ScreenType } from 'app/enums/screen-type.enum';
import { SystemUpdateStatus } from 'app/enums/system-update.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { SystemInfo } from 'app/interfaces/system-info.interface';
import { AppLoaderService } from 'app/modules/loader/app-loader.service';
import { WidgetComponent } from 'app/pages/dashboard/components/widget/widget.component';
import {
  DialogService,
} from 'app/services/dialog.service';
import { ProductImageService } from 'app/services/product-image.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { ThemeService } from 'app/services/theme/theme.service';
import { WebSocketService } from 'app/services/ws.service';
import { AppState } from 'app/store';
import { selectHasOnlyMismatchVersionsReason, selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectIsIxHardware, waitForSystemFeatures } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-widget-sysinfo',
  templateUrl: './widget-sys-info.component.html',
  styleUrls: [
    '../widget/widget.component.scss',
    './widget-sys-info.component.scss',
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [TitleCasePipe],
})
export class WidgetSysInfoComponent extends WidgetComponent implements OnInit {
  protected isHaLicensed = false;
  @Input() isPassive = false;
  protected enclosureSupport = false;
  @Input() showReorderHandle = false;

  hasOnlyMismatchVersionsReason$ = this.store$.select(selectHasOnlyMismatchVersionsReason);

  systemInfo: SystemInfo;
  ready = false;
  productImage = '';
  productModel = '';
  productEnclosure = ''; // rackmount || tower
  certified = false;
  updateAvailable = false;
  isIxHardware = false;
  isUpdateRunning = false;
  hasHa: boolean;
  updateMethod = 'update.update';
  screenType = ScreenType.Desktop;

  readonly ScreenType = ScreenType;

  constructor(
    public router: Router,
    public translate: TranslateService,
    private ws: WebSocketService,
    public sysGenService: SystemGeneralService,
    public mediaObserver: MediaObserver,
    public themeService: ThemeService,
    private store$: Store<AppState>,
    private productImgServ: ProductImageService,
    public loader: AppLoaderService,
    public dialogService: DialogService,
    private titleCase: TitleCasePipe,
    private cdr: ChangeDetectorRef,
    @Inject(WINDOW) private window: Window,
  ) {
    super(translate);
    this.sysGenService.updateRunning.pipe(untilDestroyed(this)).subscribe((isUpdateRunning: string) => {
      this.isUpdateRunning = isUpdateRunning === 'true';
      this.cdr.markForCheck();
    });

    mediaObserver.asObservable().pipe(untilDestroyed(this)).subscribe((changes) => {
      const currentScreenType = changes[0].mqAlias === 'xs' ? ScreenType.Mobile : ScreenType.Desktop;
      this.screenType = currentScreenType;
    });

    this.hasHa = this.window.localStorage.getItem('ha_status') === 'true';
  }

  get licenseString(): string {
    return this.translate.instant('{license} contract, expires {date}', {
      license: this.titleCase.transform(this.systemInfo.license.contract_type.toLowerCase()),
      date: this.systemInfo.license.contract_end.$value,
    });
  }

  ngOnInit(): void {
    this.checkForUpdate();
    this.loadSystemInfo();
    this.getEnclosureSupport();
    this.getIsIxHardware();
  }

  loadSystemInfo(): void {
    this.getSystemInfo();

    if (this.sysGenService.isEnterprise) {
      this.getIsHaLicensed();
    }
  }

  getIsIxHardware(): void {
    this.store$
      .select(selectIsIxHardware)
      .pipe(untilDestroyed(this))
      .subscribe((isIxHardware) => {
        this.isIxHardware = isIxHardware;
        this.setProductImage();
        this.cdr.markForCheck();
      });
  }

  getEnclosureSupport(): void {
    this.store$
      .pipe(waitForSystemFeatures, untilDestroyed(this))
      .subscribe((features) => {
        this.enclosureSupport = features.enclosure;
        this.cdr.markForCheck();
      });
  }

  getSystemInfo(): void {
    this.ws.call('webui.main.dashboard.sys_info')
      .pipe(untilDestroyed(this))
      .subscribe((systemInfo) => {
        if (this.isPassive) {
          this.processSysInfo(systemInfo.remote_info);
        } else {
          this.processSysInfo(systemInfo);
        }
        this.cdr.markForCheck();
      });
  }

  getIsHaLicensed(): void {
    this.store$
      .select(selectIsHaLicensed)
      .pipe(untilDestroyed(this))
      .subscribe((isHaLicensed) => {
        this.isHaLicensed = isHaLicensed;
        if (isHaLicensed) {
          this.updateMethod = 'failover.upgrade';
        }
        this.checkForRunningUpdate();
        this.cdr.markForCheck();
      });
  }

  checkForRunningUpdate(): void {
    this.ws.call('core.get_jobs', [[['method', '=', this.updateMethod], ['state', '=', JobState.Running]]]).pipe(untilDestroyed(this)).subscribe({
      next: (jobs) => {
        if (jobs && jobs.length > 0) {
          this.isUpdateRunning = true;
          this.cdr.markForCheck();
        }
      },
      error: (err) => {
        console.error(err);
      },
    });
  }

  get updateBtnLabel(): string {
    if (this.updateAvailable) {
      return this.translate.instant('Updates Available');
    }
    return this.translate.instant('Check for Updates');
  }

  processSysInfo(systemInfo: SystemInfo): void {
    this.systemInfo = systemInfo;
    this.setProductImage();
    this.ready = true;
  }

  setProductImage(): void {
    if (!this.isIxHardware || !this.systemInfo) return;

    if (this.systemInfo.platform.includes('MINI')) {
      this.setMiniImage(this.systemInfo.platform);
    } else if (this.systemInfo.platform.includes('CERTIFIED')) {
      this.certified = true;
    } else {
      const product = this.productImgServ.getServerProduct(this.systemInfo.platform);
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
    if (!this.enclosureSupport) {
      return;
    }
    this.router.navigate(['/system/viewenclosure']);
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
      this.cdr.markForCheck();
    });
  }
}
