import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import {
  MAT_DIALOG_DATA, MatDialogRef, MatDialogTitle, MatDialogContent, MatDialogActions,
} from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import { Observable, forkJoin, filter } from 'rxjs';
import { ServiceName, serviceNames, ServiceOperation } from 'app/enums/service-name.enum';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { Service } from 'app/interfaces/service.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxSlideToggleComponent } from 'app/modules/forms/ix-forms/components/ix-slide-toggle/ix-slide-toggle.component';
import { FakeProgressBarComponent } from 'app/modules/loader/components/fake-progress-bar/fake-progress-bar.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { ServicesState } from 'app/store/services/services.reducer';
import { selectService } from 'app/store/services/services.selectors';

export interface StartServiceDialogResult {
  start: boolean;
  startAutomatically: boolean;
}

@UntilDestroy()
@Component({
  selector: 'ix-start-service-dialog',
  templateUrl: './start-service-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    IxSlideToggleComponent,
    ReactiveFormsModule,
    FormActionsComponent,
    MatDialogActions,
    MatButton,
    TranslateModule,
    FakeProgressBarComponent,
    TestDirective,
  ],
})
export class StartServiceDialog implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);
  private translate = inject(TranslateService);
  private snackbar = inject(SnackbarService);
  private dialogRef = inject<MatDialogRef<StartServiceDialog, StartServiceDialogResult>>(MatDialogRef);
  private store$ = inject<Store<ServicesState>>(Store);
  private errorHandler = inject(ErrorHandlerService);
  serviceName = inject<ServiceName>(MAT_DIALOG_DATA);

  startAutomaticallyControl = new FormControl(true, { nonNullable: true });
  protected isLoading = false;
  private service: Service;

  get serviceHumanName(): string {
    return serviceNames.get(this.serviceName) || this.serviceName;
  }

  get isDisabled(): boolean {
    return !this.service.enable;
  }

  ngOnInit(): void {
    this.getService();
  }

  onCancel(): void {
    this.dialogRef.close({
      start: false,
      startAutomatically: false,
    });
  }

  onSubmit(): void {
    this.isLoading = true;
    const requests: Observable<unknown>[] = [];
    const result: StartServiceDialogResult = {
      start: true,
      startAutomatically: this.startAutomaticallyControl.value,
    };

    if (result.start && result.startAutomatically && this.isDisabled) {
      requests.push(this.api.call('service.update', [this.service.id, { enable: result.startAutomatically }]));
    }

    if (result.start) {
      requests.push(
        this.api.job('service.control', [ServiceOperation.Start, this.serviceName, { silent: false }]).pipe(observeJob()),
      );
    }

    forkJoin(requests)
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          if (result.startAutomatically) {
            this.snackbar.success(
              this.translate.instant(
                'The {service} service is running and will auto-start after a system restart.',
                { service: this.serviceHumanName },
              ),
            );
          } else {
            this.snackbar.success(
              this.translate.instant('The {service} service is running.', { service: this.serviceHumanName }),
            );
          }
          this.isLoading = false;
          this.dialogRef.close(result);
        },
        error: (error: unknown) => {
          this.isLoading = false;
          this.errorHandler.showErrorModal(error);
          this.dialogRef.close({
            start: false,
            startAutomatically: false,
          });
        },
      });
  }

  private getService(): void {
    this.store$.select(selectService(this.serviceName))
      .pipe(
        filter((service) => !!service),
        untilDestroyed(this),
      )
      .subscribe((service) => {
        this.service = service;
        this.cdr.markForCheck();
      });
  }
}
