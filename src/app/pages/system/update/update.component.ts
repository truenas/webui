import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, OnInit, signal, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { MarkdownModule } from 'ngx-markdown';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  catchError, filter, finalize, forkJoin, map, Observable, of, shareReplay, switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { ApiErrorName } from 'app/enums/api.enum';
import { Role } from 'app/enums/role.enum';
import { UpdateCode } from 'app/enums/system-update.enum';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemUpdate as helptext } from 'app/helptext/system/update';
import { Job } from 'app/interfaces/job.interface';
import { UpdateConfig, UpdateProfileChoices, UpdateStatus } from 'app/interfaces/system-update.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { selectUpdateJob } from 'app/modules/jobs/store/job.selectors';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import {
  SaveConfigDialog,
  SaveConfigDialogMessages,
} from 'app/pages/system/advanced/manage-configuration-menu/save-config-dialog/save-config-dialog.component';
import {
  DynamicMarkdownComponent,
} from 'app/pages/system/update/components/dynamic-markdown/dynamic-markdown.component';
import {
  UpdateProfileCard,
} from 'app/pages/system/update/components/update-profile-card/update-profile-card.component';
import { systemUpdateElements } from 'app/pages/system/update/update.elements';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ApiCallError } from 'app/services/errors/error.classes';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { selectIsHaLicensed } from 'app/store/ha-info/ha-info.selectors';
import { selectIsEnterprise } from 'app/store/system-info/system-info.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-update',
  styleUrls: ['update.component.scss'],
  templateUrl: './update.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    UiSearchDirective,
    TestDirective,
    TranslateModule,
    RequiresRolesDirective,
    NgxSkeletonLoaderModule,
    MatButton,
    IxIconComponent,
    ReactiveFormsModule,
    PageHeaderComponent,
    UpdateProfileCard,
    MarkdownModule,
    DynamicMarkdownComponent,
  ],
})
export class UpdateComponent implements OnInit {
  private router = inject(Router);
  private translate = inject(TranslateService);
  private matDialog = inject(MatDialog);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private dialogService = inject(DialogService);
  private sysGenService = inject(SystemGeneralService);
  private store$ = inject<Store<AppState>>(Store);
  private window = inject<Window>(WINDOW);

  protected readonly searchableElements = systemUpdateElements;
  protected readonly requiredRoles = [Role.SystemUpdateWrite];
  protected readonly manualUpdateUrl = 'https://www.truenas.com/docs/scale/scaletutorials/systemsettings/updatescale/#performing-a-manual-update';

  protected readonly isHaLicensed = toSignal(this.store$.select(selectIsHaLicensed));
  protected readonly isEnterprise = toSignal(this.store$.select(selectIsEnterprise));

  protected isLoading = signal(true);
  protected profileChoices = signal<UpdateProfileChoices | null>(null);
  protected status = signal<UpdateStatus | null>(null);
  protected config = signal<UpdateConfig | null>(null);

  protected statusDetails = computed(() => this.status()?.status);

  protected newVersion = computed(() => this.statusDetails()?.new_version);

  protected doesNotMatchProfile = computed(() => {
    return !this.statusDetails()?.current_version?.matches_profile;
  });

  protected currentVersionProfile = computed(() => {
    const profileId = this.statusDetails()?.current_version?.profile || '';
    const profile = this.profileChoices()?.[profileId];

    return profile?.name || profileId;
  });

  protected readonly isUpdateAvailable = computed(() => {
    return this.status()?.code === UpdateCode.Normal && Boolean(this.newVersion());
  });

  protected readonly isSystemUpToDate = computed(() => {
    return this.status()?.code === UpdateCode.Normal && !this.newVersion();
  });

  protected readonly isRebootRequired = computed(() => this.status()?.code === UpdateCode.RebootRequired);

  protected readonly isNetworkActivityDisabled = computed(() => {
    return this.status()?.code === UpdateCode.NetworkActivityDisabled;
  });

  protected readonly shouldShowError = computed(() => {
    const status = this.status();
    return status?.error && !this.isNetworkActivityDisabled();
  });

  protected readonly errorMessage = computed(() => {
    const status = this.status();
    if (!status?.error) {
      return '';
    }

    // Show custom messages for specific network errors
    const errname = status.error.errname;
    if (errname === (ApiErrorName.ConnectionReset as string) || errname === (ApiErrorName.TimedOut as string)) {
      return this.translate.instant('Network connection was closed or timed out. Try again later.');
    }
    if (errname === (ApiErrorName.NetworkUnreachable as string)) {
      return this.translate.instant('Network resource is not reachable, verify your network settings and health.');
    }

    // For other errors, show the reason
    return status.error.reason;
  });

  private readonly systemInfo$ = this.api.call('webui.main.dashboard.sys_info').pipe(
    shareReplay({ bufferSize: 1, refCount: true }),
  );

  protected readonly systemVersion = toSignal(this.systemInfo$.pipe(
    map((info) => info.version),
  ));

  protected readonly changelog = computed(() => {
    if (!this.newVersion()?.manifest?.changelog) {
      return '';
    }

    return this.newVersion()?.manifest?.changelog.replace(/\n/g, '\n');
  });

  protected readonly releaseNotesContext = computed(() => ({
    isHaLicensed: this.isHaLicensed(),
    isEnterprise: this.isEnterprise(),
  }));

  protected readonly standbySystemVersion = toSignal(this.systemInfo$.pipe(
    filter((info) => Boolean(info?.remote_info?.version)),
    map((info) => info.remote_info.version),
  ));

  protected isUpdateInProgress$ = this.store$.select(selectUpdateJob).pipe(
    map((jobs) => jobs.length > 0),
  );

  ngOnInit(): void {
    this.loadUpdateInfo();
  }

  private loadUpdateInfo(): void {
    this.isLoading.set(true);

    forkJoin([
      this.api.call('update.profile_choices').pipe(
        catchError((error: unknown) => this.handleApiError(error)),
      ),
      this.api.call('update.status').pipe(
        catchError((error: unknown) => this.handleApiError(error)),
      ),
      this.api.call('update.config').pipe(
        catchError((error: unknown) => this.handleApiError(error)),
      ),
    ])
      .pipe(
        finalize(() => this.isLoading.set(false)),
        untilDestroyed(this),
      )
      .subscribe(([profileChoices, updateStatus, updateConfig]) => {
        if (profileChoices) {
          this.profileChoices.set(profileChoices);
        }
        if (updateStatus) {
          this.status.set(updateStatus);
        }
        if (updateConfig) {
          this.config.set(updateConfig);
        }
      });
  }

  private handleApiError(error: unknown): Observable<null> {
    if (error instanceof ApiCallError && error.error?.data?.errname === ApiErrorName.NoNetwork) {
      return of(null);
    }
    this.errorHandler.showErrorModal(error);
    return of(null);
  }

  protected manualUpdate(): void {
    this.offerToSaveConfiguration()
      .pipe(untilDestroyed(this))
      .subscribe(() => {
        this.router.navigate(['/system/update/manualupdate']);
      });
  }

  protected onInstallUpdatePressed(): void {
    this.offerToSaveConfiguration()
      .pipe(
        switchMap(() => this.confirmUpdate()),
        switchMap(() => this.update()),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.dialogService.closeAllDialogs();
        this.sysGenService.updateDone();
        return this.isHaLicensed() ? this.controllerUpdateFinished() : this.nonHaUpdateFinished();
      });
  }

  private offerToSaveConfiguration(): Observable<unknown> {
    return this.matDialog.open(SaveConfigDialog, {
      data: {
        title: this.translate.instant('Save configuration settings from this machine before updating?'),
        saveButton: this.translate.instant('Save Configuration'),
        cancelButton: this.translate.instant('Do not save'),
      } as Partial<SaveConfigDialogMessages>,
    })
      .afterClosed();
  }

  private confirmUpdate(): Observable<true> {
    return this.dialogService.confirm({
      title: this.translate.instant('Install Update?'),
      message: this.translate.instant(
        this.isHaLicensed()
          ? helptext.haUpdateConfirmation
          : helptext.nonHaUpdateConfirmation,
      ),
      hideCheckbox: true,
      buttonText: this.translate.instant('Install'),
    })
      .pipe(filter(Boolean));
  }

  private update(): Observable<unknown> {
    this.sysGenService.updateRunningNoticeSent.emit();

    let job$: Observable<Job>;
    if (this.isHaLicensed()) {
      job$ = this.api.job('failover.upgrade');
    } else {
      job$ = this.api.job('update.run', [{ reboot: true }]);
    }

    return this.dialogService
      .jobDialog(job$, { title: this.translate.instant(this.translate.instant('Update')) })
      .afterClosed();
  }

  private controllerUpdateFinished(): Observable<boolean> {
    return this.dialogService.confirm({
      title: this.translate.instant(helptext.haUpdate.completeTitle),
      message: this.translate.instant(helptext.haUpdate.completeMessage),
      buttonText: this.translate.instant(helptext.haUpdate.completeAction),
      hideCheckbox: true,
      hideCancel: true,
    });
  }

  private nonHaUpdateFinished(): Observable<boolean> {
    // Mark that update completed successfully - reload page after restart to get latest UI
    this.window.sessionStorage.setItem('updateCompleted', 'true');

    return this.dialogService.confirm({
      title: this.translate.instant(helptext.haUpdate.completeTitle),
      message: this.translate.instant('Update completed successfully. The system will restart shortly'),
      buttonText: this.translate.instant(helptext.haUpdate.completeAction),
      hideCheckbox: true,
      hideCancel: true,
    });
  }

  protected onProfileSwitched(): void {
    // Reload all update info after profile switch
    this.loadUpdateInfo();
  }
}
