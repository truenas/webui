import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, forwardRef, output, Signal, viewChild, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { TnStepComponent, TnStepperComponent } from '@truenas/ui-components';
import {
  BehaviorSubject, Observable, merge,
  of,
} from 'rxjs';
import { cloudSyncProviderNameMap } from 'app/enums/cloudsync-provider.enum';
import { Role } from 'app/enums/role.enum';
import { CloudSyncTask, CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudSyncWhatAndWhenComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-what-and-when/cloudsync-what-and-when.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { CloudSyncProviderComponent } from './steps/cloudsync-provider/cloudsync-provider.component';

@Component({
  selector: 'ix-cloudsync-wizard',
  templateUrl: './cloudsync-wizard.component.html',
  styleUrls: ['./cloudsync-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CloudSyncProviderComponent,
    CloudSyncWhatAndWhenComponent,
    TnStepperComponent,
    TnStepComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class CloudSyncWizardComponent {
  // Optional: present only in the legacy SlideIn host. Absent when hosted in the `<tn-side-panel>`
  // form panel (opened via FormSidePanelService with `footerless: true` — the stepper owns its own
  // Next/Save buttons), where close happens through {@link closed}.
  slideInRef = inject<SlideInRef<undefined, CloudSyncTask>>(SlideInRef, { optional: true });
  private api = inject(ApiService);
  private snackbarService = inject(SnackbarService);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  readonly whatAndWhen: Signal<CloudSyncWhatAndWhenComponent>
    = viewChild(forwardRef(() => CloudSyncWhatAndWhenComponent));

  readonly cloudSyncProvider: Signal<CloudSyncProviderComponent>
    = viewChild(forwardRef(() => CloudSyncProviderComponent));

  protected readonly requiredRoles = [Role.CloudSyncWrite];

  /** Fired on a successful submit when hosted in a `<tn-side-panel>` (true = saved). */
  readonly closed = output<boolean>();

  isLoading$ = new BehaviorSubject(false);
  isProviderLoading$ = new BehaviorSubject(false);
  mergedLoading$: Observable<boolean> = merge(this.isLoading$, this.isProviderLoading$);
  existingCredential: CloudSyncCredential | undefined;

  constructor() {
    this.slideInRef?.requireConfirmationWhen(() => of(this.hasUnsavedChanges()));
  }

  /** Host hook (`<tn-side-panel>` closeGuard) — dirty across either step. */
  hasUnsavedChanges(): boolean {
    return Boolean(this.whatAndWhen()?.form?.dirty || this.cloudSyncProvider()?.isDirty());
  }

  /** Whether the form is currently submitting; the host shows a progress bar while true. */
  isBusy(): boolean {
    return this.isLoading$.value || this.isProviderLoading$.value;
  }

  private createTask(payload: CloudSyncTaskUpdate): Observable<CloudSyncTask> {
    return this.api.call('cloudsync.create', [payload]);
  }

  onProviderSaved(credential: CloudSyncCredential): void {
    this.existingCredential = credential;
    if (!credential) {
      return;
    }
    this.whatAndWhen()?.form.patchValue({ credentials: credential.id });
    this.updateDescriptionValue();
    this.cdr.markForCheck();
  }

  onProviderLoading(loading: boolean): void {
    this.isProviderLoading$.next(loading);
  }

  onSubmit(): void {
    this.isLoading$.next(true);

    const payload = this.whatAndWhen().getPayload();

    this.createTask(payload).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: (response) => {
        this.snackbarService.success(this.translate.instant('Task created'));
        this.isLoading$.next(false);
        if (this.slideInRef) {
          this.slideInRef.close({ response });
        } else {
          this.closed.emit(true);
        }

        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isLoading$.next(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  private updateDescriptionValue(): void {
    const provider = this.existingCredential.provider.type;

    const whatAndWhen = this.whatAndWhen();
    const sourcePath = whatAndWhen?.form.controls.path_source.value.join(', ');
    whatAndWhen?.form.patchValue({
      description: `${cloudSyncProviderNameMap.get(provider)} - ${sourcePath}`,
    });
    this.cdr.markForCheck();
  }
}
