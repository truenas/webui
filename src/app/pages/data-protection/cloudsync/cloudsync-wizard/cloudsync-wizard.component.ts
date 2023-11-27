import {
  AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, forwardRef,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable, filter, merge,
} from 'rxjs';
import { cloudsyncProviderNameMap } from 'app/enums/cloudsync-provider.enum';
import { CloudSyncTask, CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';
import { CloudsyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { IxSlideInRef } from 'app/modules/ix-forms/components/ix-slide-in/ix-slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { CloudsyncProviderComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-provider/cloudsync-provider.component';
import { CloudsyncWhatAndWhenComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-what-and-when/cloudsync-what-and-when.component';
import { CloudCredentialService } from 'app/services/cloud-credential.service';
import { DialogService } from 'app/services/dialog.service';
import { ErrorHandlerService } from 'app/services/error-handler.service';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './cloudsync-wizard.component.html',
  styleUrls: ['./cloudsync-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CloudCredentialService],
})
export class CloudsyncWizardComponent implements AfterViewInit {
  @ViewChild(forwardRef(() => CloudsyncProviderComponent)) provider: CloudsyncProviderComponent;
  @ViewChild(forwardRef(() => CloudsyncWhatAndWhenComponent)) whatAndWhen: CloudsyncWhatAndWhenComponent;
  isLoading$ = new BehaviorSubject(false);
  mergedLoading$: Observable<boolean>;
  existingCredential: CloudsyncCredential;

  constructor(
    public slideInRef: IxSlideInRef<CloudsyncWizardComponent>,
    private ws: WebSocketService,
    private snackbarService: SnackbarService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private dialogService: DialogService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngAfterViewInit(): void {
    this.mergedLoading$ = merge(this.isLoading$, this.provider.isLoading$);
    this.provider.form.controls.exist_credential.valueChanges
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((credential) => {
        if (typeof credential === 'number') {
          this.whatAndWhen?.form.patchValue({ credentials: credential });
        } else {
          this.whatAndWhen?.form.patchValue({ credentials: null });
        }
        this.updateDescriptionValue();
        this.cdr.markForCheck();
      });
  }

  createTask(payload: CloudSyncTaskUpdate): Observable<CloudSyncTask> {
    return this.ws.call('cloudsync.create', [payload]);
  }

  onProviderSaved(credential: CloudsyncCredential): void {
    this.existingCredential = credential;
    this.cdr.markForCheck();
  }

  onSubmit(): void {
    this.isLoading$.next(true);

    const payload = this.whatAndWhen.getPayload();

    this.createTask(payload).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.snackbarService.success(this.translate.instant('Task created'));
        this.isLoading$.next(false);
        this.slideInRef.close(true);
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.dialogService.error(this.errorHandler.parseWsError(err));
      },
    });
  }

  updateDescriptionValue(): void {
    const provider = this.existingCredential?.provider
      ? this.existingCredential.provider
      : this.provider.form.controls.provider.value;

    const sourcePath = this.whatAndWhen?.form.controls.path_source.value.join(', ');
    this.whatAndWhen?.form.patchValue({
      description: `${cloudsyncProviderNameMap.get(provider)} - ${sourcePath}`,
    });
    this.cdr.markForCheck();
  }
}
