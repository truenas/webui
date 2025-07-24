import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, computed, OnInit, signal,
} from '@angular/core';
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
  filter, finalize, forkJoin, map, Observable, shareReplay, switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { UpdateCode } from 'app/enums/system-update.enum';
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
    UiSearchDirective,
    TestDirective,
    TranslateModule,
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

  constructor(
    private router: Router,
    private translate: TranslateService,
    private matDialog: MatDialog,
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private dialogService: DialogService,
    private sysGenService: SystemGeneralService,
    private store$: Store<AppState>,
  ) {}

  ngOnInit(): void {
    this.loadUpdateInfo();
  }

  private loadUpdateInfo(): void {
    this.isLoading.set(true);

    forkJoin([
      this.api.call('update.profile_choices'),
      this.api.call('update.status'),
      this.api.call('update.config'),
    ])
      .pipe(
        this.errorHandler.withErrorHandler(),
        finalize(() => this.isLoading.set(false)),
        untilDestroyed(this),
      )
      .subscribe(([profileChoices, updateStatus, updateConfig]) => {
        this.profileChoices.set(profileChoices);
        this.status.set(updateStatus);
        this.config.set(updateConfig);
      });
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
    return this.dialogService.confirm({
      title: this.translate.instant(helptext.haUpdate.completeTitle),
      message: this.translate.instant('Update completed successfully. The system will restart shortly'),
      buttonText: this.translate.instant(helptext.haUpdate.completeAction),
      hideCheckbox: true,
      hideCancel: true,
    });
  }
}
