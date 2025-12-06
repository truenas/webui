import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, OnInit, signal, inject,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatBadge } from '@angular/material/badge';
import { MatIconButton, MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
// import { MatIconRegistry } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbar, MatToolbarRow } from '@angular/material/toolbar';
import { MatTooltip } from '@angular/material/tooltip';
import { DomSanitizer } from '@angular/platform-browser';
import { NavigationEnd, Router } from '@angular/router';
import { ɵɵRouterLink } from '@angular/router/testing';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  filter, map, Observable, Subscription, switchMap, tap,
} from 'rxjs';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { JobState } from 'app/enums/job-state.enum';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { helptextTopbar } from 'app/helptext/topbar';
import { AlertSlice, selectImportantUnreadAlertsCount } from 'app/modules/alerts/store/alert.selectors';
import { RebootRequiredDialog } from 'app/modules/dialog/components/reboot-required-dialog/reboot-required-dialog.component';
import { UpdateDialog } from 'app/modules/dialog/components/update-dialog/update-dialog.component';
import { FeedbackDialog } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { GlobalSearchTriggerComponent } from 'app/modules/global-search/components/global-search-trigger/global-search-trigger.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { selectUpdateJobs } from 'app/modules/jobs/store/job.selectors';
import { AboutNasDialog } from 'app/modules/layout/topbar/about-nas-dialog/about-nas-dialog.component';
import { CheckinIndicatorComponent } from 'app/modules/layout/topbar/checkin-indicator/checkin-indicator.component';
import { HaStatusIconComponent } from 'app/modules/layout/topbar/ha-status-icon/ha-status-icon.component';
import { JobsIndicatorComponent } from 'app/modules/layout/topbar/jobs-indicator/jobs-indicator.component';
import { PowerMenuComponent } from 'app/modules/layout/topbar/power-menu/power-menu.component';
import { ResilveringIndicatorComponent } from 'app/modules/layout/topbar/resilvering-indicator/resilvering-indicator.component';
import { toolBarElements } from 'app/modules/layout/topbar/topbar.elements';
import { UserMenuComponent } from 'app/modules/layout/topbar/user-menu/user-menu.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { TruenasConnectService } from 'app/modules/truenas-connect/services/truenas-connect.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { NavigationService } from 'app/services/navigation/navigation.service';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectRebootInfo } from 'app/store/reboot-info/reboot-info.selectors';
import { selectHasConsoleFooter } from 'app/store/system-config/system-config.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';
import { alertIndicatorPressed, sidenavIndicatorPressed } from 'app/store/topbar/topbar.actions';

@UntilDestroy()
@Component({
  selector: 'ix-topbar',
  templateUrl: './topbar.component.html',
  styleUrls: ['./topbar.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatToolbar,
    MatToolbarRow,
    MatIconButton,
    MatTooltip,
    IxIconComponent,
    GlobalSearchTriggerComponent,
    CheckinIndicatorComponent,
    ResilveringIndicatorComponent,
    HaStatusIconComponent,
    JobsIndicatorComponent,
    MatBadge,
    UserMenuComponent,
    PowerMenuComponent,
    AsyncPipe,
    TranslateModule,
    UiSearchDirective,
    TestDirective,
    MatButtonModule, MatMenuModule,
    ɵɵRouterLink,
  ],
})
export class TopbarComponent implements OnInit {
  private router = inject(Router);
  private systemGeneralService = inject(SystemGeneralService);
  private matDialog = inject(MatDialog);
  private store$ = inject<Store<AlertSlice>>(Store);
  private appStore$ = inject<Store<AppState>>(Store);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  private tnc = inject(TruenasConnectService);
  private apiService = inject<ApiService>(ApiService);
  // private matIconRegistry = inject(MatIconRegistry);
  private domSanitizer = inject(DomSanitizer);

  updateIsDone: Subscription;

  updateDialog: MatDialogRef<UpdateDialog>;
  private readonly isEnterprise = toSignal(this.appStore$.select(selectIsEnterprise));
  isHaLicensed = false;
  updateIsRunning = false;
  systemWillRestart = false;
  updateNotificationSent = false;
  tooltips = helptextTopbar.tooltips;
  protected searchableElements = toolBarElements;

  private navService = inject(NavigationService);

  menuItems = this.navService.menuItems;
  pageTitle = '';


  readonly hasRebootRequiredReasons = signal(false);
  readonly shownDialog = signal(false);
  readonly hasTncConfig = computed(() => {
    const config = this.tnc.config();
    return config?.tnc_base_url && config?.account_service_base_url && config?.leca_service_base_url;
  });

  readonly alertBadgeCount$ = this.store$.select(selectImportantUnreadAlertsCount);
  readonly hasConsoleFooter$ = this.store$.select(selectHasConsoleFooter);

  updateText = computed(() => {
    if (this.isHaLicensed || !this.systemWillRestart) {
      return this.translate.instant(helptextGlobal.sysUpdateMessage);
    }
    return [
      this.translate.instant(helptextGlobal.sysUpdateMessage),
      this.translate.instant(helptextGlobal.sysUpdateMessagePt2),
    ].join(' ');
  });

  constructor() {
    this.systemGeneralService.updateRunningNoticeSent.pipe(untilDestroyed(this)).subscribe(() => {
      this.updateNotificationSent = true;
      this.cdr.markForCheck();
    });
  }

  ngOnInit(): void {
    if (this.isEnterprise()) {
      this.store$.select(selectIsHaLicensed).pipe(untilDestroyed(this)).subscribe((isHaLicensed) => {
        this.isHaLicensed = isHaLicensed;
        this.cdr.markForCheck();
      });
    }

    // 1. 先获取初始路由状态
    this.updatePageTitle(this.router.url);

    // 2. 然后监听路由变化
    this.router.events.pipe(
      filter((event) => event instanceof NavigationEnd),
      map(() => this.router.url),
      untilDestroyed(this),
    ).subscribe((url) => {
      this.updatePageTitle(url);
    });

    // this.matIconRegistry.addSvgIcon(
    //   'truenas_logo',
    //   this.domSanitizer.bypassSecurityTrustResourceUrl('assets/images/logo.svg'),
    // );

    this.store$.select(selectUpdateJobs).pipe(untilDestroyed(this)).subscribe((jobs) => {
      const job = jobs[0];
      if (!job) {
        this.updateIsRunning = false;
        this.updateDialog?.close();
        return;
      }

      this.updateIsRunning = true;
      if (job.state === JobState.Failed || job.state === JobState.Aborted) {
        this.updateIsRunning = false;
        this.systemWillRestart = false;
        this.updateDialog?.close();
      }

      // When update starts on HA system, listen for 'finish', then quit listening
      if (this.isHaLicensed) {
        this.updateIsDone = this.systemGeneralService.updateIsDone$.pipe(untilDestroyed(this)).subscribe(() => {
          this.updateIsRunning = false;
          this.updateIsDone.unsubscribe();
        });
      }
      if (
        !this.isHaLicensed
        && job?.arguments[0]
        && (job.arguments[0] as { reboot: boolean }).reboot
      ) {
        this.systemWillRestart = true;
        if (job.state === JobState.Success) {
          this.router.navigate(['/system-tasks/restart'], { skipLocationChange: true });
        }
      }

      if (!this.updateNotificationSent) {
        this.updateInProgress();
        this.updateNotificationSent = true;
      }

      this.cdr.markForCheck();
    });

    this.showRebootInfoDialog();
  }

  // 3. 提取更新标题的逻辑到单独方法
  private updatePageTitle(url: string): void {
    this.pageTitle = this.menuItems.find((item) => url.startsWith('/' + item.state))?.name || '';
    this.cdr.markForCheck();
  }

  showAboutNasDialog(): void {
    this.matDialog.open(AboutNasDialog, {
      width: '400px',
    });
  }

  onAlertIndicatorPressed(): void {
    this.store$.dispatch(alertIndicatorPressed());
  }

  onSidenavIndicatorPressed(): void {
    this.store$.dispatch(sidenavIndicatorPressed());
  }

  private updateInProgress(): void {
    this.systemGeneralService.updateRunning.emit('true');
    if (!this.updateNotificationSent) {
      this.showUpdateDialog();
      this.updateNotificationSent = true;
    }
  }

  showUpdateDialog(): void {
    this.matDialog.open(UpdateDialog);
  }

  showRebootInfoDialog(): void {
    this.checkRebootInfo().pipe(untilDestroyed(this)).subscribe(() => {
      this.shownDialog.set(false);
    });
  }

  onFeedbackIndicatorPressed(): void {
    this.matDialog.open(FeedbackDialog);
  }

  private checkRebootInfo(): Observable<unknown> {
    return this.appStore$.select(selectRebootInfo).pipe(
      tap(() => this.hasRebootRequiredReasons.set(false)),
      filter(({ thisNodeRebootInfo, otherNodeRebootInfo }) => {
        return !!thisNodeRebootInfo?.reboot_required_reasons?.length
          || !!otherNodeRebootInfo?.reboot_required_reasons?.length;
      }),
      tap(() => this.hasRebootRequiredReasons.set(true)),
      filter(() => !this.shownDialog()),
      tap(() => this.shownDialog.set(true)),
      switchMap(() => this.matDialog.open(RebootRequiredDialog, { minWidth: '400px' }).afterClosed()),
    );
  }
}
