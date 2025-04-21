import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, forwardRef,
  Signal,
  viewChild,
} from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatStepperModule } from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  BehaviorSubject, Observable, merge,
  of,
} from 'rxjs';
import { cloudSyncProviderNameMap } from 'app/enums/cloudsync-provider.enum';
import { Role } from 'app/enums/role.enum';
import { CloudSyncTask, CloudSyncTaskUpdate } from 'app/interfaces/cloud-sync-task.interface';
import { CloudSyncCredential } from 'app/interfaces/cloudsync-credential.interface';
import {
  UseIxIconsInStepperComponent,
} from 'app/modules/ix-icon/use-ix-icons-in-stepper/use-ix-icons-in-stepper.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { CloudSyncWhatAndWhenComponent } from 'app/pages/data-protection/cloudsync/cloudsync-wizard/steps/cloudsync-what-and-when/cloudsync-what-and-when.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { CloudSyncProviderComponent } from './steps/cloudsync-provider/cloudsync-provider.component';

@UntilDestroy()
@Component({
  selector: 'ix-cloudsync-wizard',
  templateUrl: './cloudsync-wizard.component.html',
  styleUrls: ['./cloudsync-wizard.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CloudSyncProviderComponent,
    CloudSyncWhatAndWhenComponent,
    ModalHeaderComponent,
    MatCardModule,
    MatStepperModule,
    TranslateModule,
    AsyncPipe,
    UseIxIconsInStepperComponent,
  ],
})
export class CloudSyncWizardComponent {
  readonly whatAndWhen: Signal<CloudSyncWhatAndWhenComponent>
    = viewChild(forwardRef(() => CloudSyncWhatAndWhenComponent));

  readonly cloudSyncProvider: Signal<CloudSyncProviderComponent>
    = viewChild(forwardRef(() => CloudSyncProviderComponent));

  protected readonly requiredRoles = [Role.CloudSyncWrite];

  isLoading$ = new BehaviorSubject(false);
  isProviderLoading$ = new BehaviorSubject(false);
  mergedLoading$: Observable<boolean> = merge(this.isLoading$, this.isProviderLoading$);
  existingCredential: CloudSyncCredential | undefined;

  constructor(
    public slideInRef: SlideInRef<undefined, CloudSyncTask | false>,
    private api: ApiService,
    private snackbarService: SnackbarService,
    private cdr: ChangeDetectorRef,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
  ) {
    this.slideInRef.requireConfirmationWhen(() => of(
      Boolean(this.whatAndWhen()?.form?.dirty || this.cloudSyncProvider()?.isDirty()),
    ));
  }

  createTask(payload: CloudSyncTaskUpdate): Observable<CloudSyncTask> {
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
      untilDestroyed(this),
    ).subscribe({
      next: (response) => {
        this.snackbarService.success(this.translate.instant('Task created'));
        this.isLoading$.next(false);
        this.slideInRef.close({ response, error: null });

        this.cdr.markForCheck();
      },
      error: (error: unknown) => {
        this.isLoading$.next(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }

  updateDescriptionValue(): void {
    const provider = this.existingCredential.provider.type;

    const whatAndWhen = this.whatAndWhen();
    const sourcePath = whatAndWhen?.form.controls.path_source.value.join(', ');
    whatAndWhen?.form.patchValue({
      description: `${cloudSyncProviderNameMap.get(provider)} - ${sourcePath}`,
    });
    this.cdr.markForCheck();
  }
}
