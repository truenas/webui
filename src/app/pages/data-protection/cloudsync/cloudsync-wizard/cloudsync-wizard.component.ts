import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ViewChild, forwardRef } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import { Observable, filter, forkJoin, switchMap, tap } from 'rxjs';
import { cloudsyncProviderNameMap } from 'app/enums/cloudsync-provider.enum';
import { CloudCredential, CloudSyncTask, CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';
import { CloudsyncCredential, CloudsyncCredentialUpdate } from 'app/interfaces/cloudsync-credential.interface';
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
  isLoading = false;

  existCredentialId: number;
  createdProviders: CloudsyncCredential[] = [];
  createdTasks: CloudSyncTask[] = [];

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
    this.provider?.form.controls.exist_credential.valueChanges
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((credential) => {
        this.existCredentialId = credential;
        this.whatAndWhen?.form.patchValue({ credentials: credential });
      });

    this.provider?.form.controls.provider.valueChanges
      .pipe(untilDestroyed(this))
      .subscribe((provider) => {
        const sourcePath = this.whatAndWhen?.form.controls.path_source.value.join(', ');
        this.whatAndWhen?.form.patchValue({
          description: `${cloudsyncProviderNameMap.get(provider)} - ${sourcePath}`,
        });
      });
  }

  updateProvider(id: number, payload: CloudsyncCredentialUpdate): Observable<CloudCredential> {
    return this.ws.call('cloudsync.credentials.update', [id, payload]);
  }

  createProvider(payload: CloudsyncCredentialUpdate): Observable<CloudsyncCredential> {
    return this.ws.call('cloudsync.credentials.create', [payload]);
  }

  createTask(payload: CloudSyncTaskUpdate): Observable<CloudSyncTask> {
    return this.ws.call('cloudsync.create', [payload]);
  }

  onSubmit(): void {
    this.isLoading = true;
    this.createdProviders = [];
    this.createdTasks = [];

    const providerPayload = this.provider.getPayload();
    const taskPayload = this.whatAndWhen.getPayload();

    let request$ = this.createProvider(providerPayload).pipe(
      tap((provider) => this.createdProviders.push(provider)),
      switchMap((provider) => this.createTask({
        ...taskPayload,
        credentials: provider.id,
      })),
      tap((createdTask) => this.createdTasks.push(createdTask)),
    );

    if (this.existCredentialId) {
      request$ = this.createTask(taskPayload).pipe(
        tap((createdTask) => this.createdTasks.push(createdTask)),
      );
    }

    request$.pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.snackbarService.success(this.translate.instant('Task created'));
        this.isLoading = false;
        this.slideInRef.close(true);
        this.cdr.markForCheck();
      }, error: (err) => {
        this.dialogService.error(this.errorHandler.parseWsError(err));
        this.rollBack();
      },
    });
  }

  rollBack(): void {
    const requests: Observable<unknown>[] = [];

    this.createdProviders.forEach((credential) => {
      requests.push(this.ws.call('cloudsync.credentials.delete', [credential.id]));
    });

    this.createdTasks.forEach((task) => {
      requests.push(this.ws.call('cloudsync.delete', [task.id]));
    });

    if (requests.length) {
      forkJoin(requests)
        .pipe(untilDestroyed(this))
        .subscribe({
          next: () => {
            this.isLoading = false;
            this.cdr.markForCheck();
          },
          error: () => {
            this.isLoading = false;
            this.cdr.markForCheck();
          },
        });
    } else {
      this.isLoading = false;
      this.cdr.markForCheck();
    }
  }

  getSteps(): [
    CloudsyncProviderComponent,
    CloudsyncWhatAndWhenComponent,
  ] {
    return [this.provider, this.whatAndWhen];
  }
}
