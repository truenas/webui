import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard } from '@angular/material/card';
import {
  MatStep, MatStepLabel, MatStepper, MatStepperNext, MatStepperPrevious,
} from '@angular/material/stepper';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  finalize, forkJoin, map, Observable, switchMap,
} from 'rxjs';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import {
  UseIxIconsInStepperComponent,
} from 'app/modules/ix-icon/use-ix-icons-in-stepper/use-ix-icons-in-stepper.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { NvmeOfService } from 'app/pages/sharing/nvme-of/services/nvme-of.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-add-subsystem',
  templateUrl: './add-subsystem.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ModalHeaderComponent,
    TranslateModule,
    MatCard,
    ReactiveFormsModule,
    MatStep,
    MatStepLabel,
    MatStepper,
    UseIxIconsInStepperComponent,
    MatButton,
    MatStepperNext,
    TestDirective,
    IxInputComponent,
    MatStepperPrevious,
  ],
})
export class AddSubsystemComponent {
  // TODO: Handle edit case
  protected isLoading = signal(false);

  protected form = this.formBuilder.group({
    name: ['', Validators.required],
    ana: [false],

    allowAnyHost: [false],
    allowedHosts: [[] as number[]],

    ports: [[] as number[]],
  });

  constructor(
    private formBuilder: FormBuilder,
    public slideInRef: SlideInRef<void, false | NvmeOfSubsystem>,
    private api: ApiService,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    private nvmeOfService: NvmeOfService,
  ) {}

  protected onSubmit(): void {
    this.isLoading.set(true);
    this.createSubsystem().pipe(
      switchMap((subsystem) => {
        return forkJoin([
          this.nvmeOfService.associatePorts(subsystem, this.form.value.ports),
          this.nvmeOfService.associateHosts(subsystem, this.form.value.allowedHosts),
        ]).pipe(
          map(() => subsystem),
        );
      }),
      finalize(() => this.isLoading.set(false)),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    )
      .subscribe((subsystem) => {
        this.snackbar.success(this.translate.instant('New subsystem added'));
        this.slideInRef.close({
          response: subsystem,
          error: null,
        });
      });
  }

  private createSubsystem(): Observable<NvmeOfSubsystem> {
    const values = this.form.value;
    const payload = {
      name: values.name,
      allow_any_host: values.allowAnyHost,
      ana: values.ana,
    };

    return this.api.call('nvmet.subsys.create', [payload]);
  }
}
