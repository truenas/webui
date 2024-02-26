import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, forwardRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable, merge,
} from 'rxjs';
import { cloudSyncProviderNameMap } from 'app/enums/cloudsync-provider.enum';
import { Role } from 'app/enums/role.enum';
import { CloudSyncTask, CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { ChainedRef } from 'app/modules/ix-forms/components/ix-slide-in/chained-component-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CloudSyncWhatAndWhenComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-what-and-when/cloudsync-what-and-when.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './cloudsync-wizard.component.html',
  styleUrls: ['./cloudsync-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CloudCredentialService],
})
export class CloudSyncWizardComponent {
  @ViewChild(forwardRef(() => CloudSyncWhatAndWhenComponent)) whatAndWhen: CloudSyncWhatAndWhenComponent;

  protected requiredRoles = [Role.CloudSyncWrite];

  isLoading$ = new BehaviorSubject(false);
  isProviderLoading$ = new BehaviorSubject(false);
  mergedLoading$: Observable<boolean> = merge(this.isLoading$, this.isProviderLoading$);
  existingCredential: CloudSyncCredential;

  constructor(
    private chainedRef: ChainedRef<unknown>,
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

  onProviderSaved(credential: CloudSyncCredential): void {
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
        this.chainedRef.close({ response, error: null });

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
      description: `${cloudSyncProviderNameMap.get(provider)} - ${sourcePath}`,
    });
    this.cdr.markForCheck();
  }
}
