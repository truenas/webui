import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, Inject, ViewChild, forwardRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable, merge,
} from 'rxjs';
import { cloudsyncProviderNameMap } from 'app/enums/cloudsync-provider.enum';
import { Role } from 'app/enums/role.enum';
import { CloudSyncTask, CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';
import { CloudsyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { CHAINED_SLIDE_IN_REF } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in.token';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CloudsyncWhatAndWhenComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-what-and-when/cloudsync-what-and-when.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { ChainedComponentRef } from 'app/services/ix-chained-slide-in.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './cloudsync-wizard.component.html',
  styleUrls: ['./cloudsync-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CloudCredentialService],
})
export class CloudsyncWizardComponent {
  @ViewChild(forwardRef(() => CloudsyncWhatAndWhenComponent)) whatAndWhen: CloudsyncWhatAndWhenComponent;

  protected requiredRoles = [Role.CloudSyncWrite];

  isLoading$ = new BehaviorSubject(false);
  isProviderLoading$ = new BehaviorSubject(false);
  mergedLoading$: Observable<boolean> = merge(this.isLoading$, this.isProviderLoading$);
  existingCredential: CloudsyncCredential;

  constructor(
    @Inject(CHAINED_SLIDE_IN_REF) private chainedSlideInRef: ChainedComponentRef,
    private ws: WebSocketService,
    private snackbarService: SnackbarService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {}

  createTask(payload: CloudSyncTaskUpdate): Observable<CloudSyncTask> {
    return this.ws.call('cloudsync.create', [payload]);
  }

  onProviderSaved(credential: CloudsyncCredential): void {
    this.existingCredential = credential;
    if (!credential) {
      return;
    }
    this.whatAndWhen?.form.patchValue({ credentials: credential.id });
    this.updateDescriptionValue();
    this.cdr.markForCheck();
  }

  onProviderLoading(loading: boolean): void {
    this.isProviderLoading$.next(loading);
  }

  onSubmit(): void {
    this.isLoading$.next(true);

    const payload = this.whatAndWhen.getPayload();

    this.createTask(payload).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: (response) => {
        this.snackbarService.success(this.translate.instant('Task created'));
        this.isLoading$.next(false);
        this.chainedSlideInRef.close({ response, error: null });

        this.cdr.markForCheck();
      },
      error: (err) => {
        this.isLoading$.next(false);
        this.dialogService.error(this.errorHandler.parseError(err));
      },
    });
  }

  updateDescriptionValue(): void {
    const provider = this.existingCredential.provider;

    const sourcePath = this.whatAndWhen?.form.controls.path_source.value.join(', ');
    this.whatAndWhen?.form.patchValue({
      description: `${cloudsyncProviderNameMap.get(provider)} - ${sourcePath}`,
    });
    this.cdr.markForCheck();
  }
}
