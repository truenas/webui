import {
  ChangeDetectionStrategy, Component, computed, OnInit, signal,
} from '@angular/core';
import {
  FormsModule, NonNullableFormBuilder, ReactiveFormsModule, Validators,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { NvmeOfHost } from 'app/interfaces/nvme-of.interface';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { ModalHeaderComponent } from 'app/modules/slide-ins/components/modal-header/modal-header.component';
import { SlideInRef } from 'app/modules/slide-ins/slide-in-ref';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@UntilDestroy()
@Component({
  selector: 'ix-host-form',
  templateUrl: './host-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    IxFieldsetComponent,
    MatCard,
    MatCardContent,
    ModalHeaderComponent,
    TranslateModule,
    IxInputComponent,
    FormActionsComponent,
    MatButton,
    TestDirective,
    ReactiveFormsModule,
  ],
})
export class HostFormComponent implements OnInit {
  protected isLoading = signal(false);

  private existingHost = signal<NvmeOfHost | null>(null);

  protected isNew = computed(() => !this.existingHost());

  protected form = this.formBuilder.group({
    hostnqn: ['', Validators.required],
  });

  constructor(
    private api: ApiService,
    private formBuilder: NonNullableFormBuilder,
    private snackbar: SnackbarService,
    private translate: TranslateService,
    private errorHandler: ErrorHandlerService,
    public slideInRef: SlideInRef<NvmeOfHost, boolean>,
  ) {}

  ngOnInit(): void {
    const existingHost = this.slideInRef.getData();

    if (existingHost) {
      this.existingHost.set(existingHost);

      this.form.patchValue(existingHost);
    }
  }

  protected onSubmit(): void {
    this.isLoading.set(true);

    const payload = this.form.getRawValue();

    const request$ = this.isNew()
      ? this.api.call('nvmet.host.create', [payload])
      : this.api.call('nvmet.host.update', [this.existingHost().id, payload]);

    request$.pipe(
      finalize(() => this.isLoading.set(false)),
      this.errorHandler.withErrorHandler(),
      untilDestroyed(this),
    ).subscribe(() => {
      this.snackbar.success(
        this.isNew()
          ? this.translate.instant('Host Created')
          : this.translate.instant('Host Updated'),
      );

      this.slideInRef.close({
        response: true,
        error: null,
      });
    });
  }
}
