import {
  ChangeDetectionStrategy,
  Component, Inject, input, output,
} from '@angular/core';
import {
  AbstractControl, FormBuilder, Validators, ReactiveFormsModule,
} from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MatDialogContent, MatDialogActions } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import * as EmailValidator from 'email-validator';
import { finalize, of } from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import {
  ticketAcceptedFiles,
  TicketCategory, ticketCategoryLabels,
  TicketCriticality, ticketCriticalityLabels,
  TicketEnvironment, ticketEnvironmentLabels,
} from 'app/enums/file-ticket.enum';
import { mapToOptions } from 'app/helpers/options.helper';
import { WINDOW } from 'app/helpers/window.helper';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { FeedbackDialogComponent } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { FormActionsComponent } from 'app/modules/forms/ix-forms/components/form-actions/form-actions.component';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxChipsComponent } from 'app/modules/forms/ix-forms/components/ix-chips/ix-chips.component';
import { IxFileInputComponent } from 'app/modules/forms/ix-forms/components/ix-file-input/ix-file-input.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxTextareaComponent } from 'app/modules/forms/ix-forms/components/ix-textarea/ix-textarea.component';
import { FormErrorHandlerService } from 'app/modules/forms/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/forms/ix-forms/services/ix-validators.service';
import { emailValidator } from 'app/modules/forms/ix-forms/validators/email-validation/email-validation';
import { ImageValidatorService } from 'app/modules/forms/ix-forms/validators/image-validator/image-validator.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/services/websocket/api.service';

@UntilDestroy()
@Component({
  selector: 'ix-file-ticket-licensed',
  styleUrls: ['file-ticket-licensed.component.scss'],
  templateUrl: './file-ticket-licensed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatDialogContent,
    ReactiveFormsModule,
    IxInputComponent,
    IxChipsComponent,
    IxSelectComponent,
    IxTextareaComponent,
    IxCheckboxComponent,
    IxFileInputComponent,
    MatDialogActions,
    FormActionsComponent,
    MatButton,
    TestDirective,
    TranslateModule,
  ],
})
export class FileTicketLicensedComponent {
  readonly dialogRef = input.required<MatDialogRef<FeedbackDialogComponent>>();
  readonly isLoading = input<boolean>();

  readonly isLoadingChange = output<boolean>();

  protected form = this.formBuilder.group({
    name: ['', [Validators.required]],
    email: ['', [Validators.required, emailValidator()]],
    cc: [[] as string[], [
      this.validatorsService.customValidator(
        (control: AbstractControl<string[]>) => {
          return control.value?.every((item: string) => EmailValidator.validate(item));
        },
        this.translate.instant(helptext.cc.err),
      ),
    ]],
    phone: ['', [Validators.required]],
    category: [TicketCategory.Bug, [Validators.required]],
    environment: [TicketEnvironment.Production, [Validators.required]],
    criticality: [TicketCriticality.Inquiry, [Validators.required]],
    title: ['', [Validators.required, Validators.maxLength(200)]],

    message: ['', [Validators.maxLength(20000)]],
    images: [[] as File[], []],
    attach_debug: [true],
    attach_images: [false],
    take_screenshot: [true],
  });

  protected readonly messagePlaceholder = helptext.bug.message.placeholder;
  protected readonly acceptedFiles = ticketAcceptedFiles;

  readonly categoryOptions$ = of(mapToOptions(ticketCategoryLabels, this.translate));
  readonly environmentOptions$ = of(mapToOptions(ticketEnvironmentLabels, this.translate));
  readonly criticalityOptions$ = of(mapToOptions(ticketCriticalityLabels, this.translate));

  readonly tooltips = {
    name: helptext.name.tooltip,
    email: helptext.email.tooltip,
    cc: helptext.cc.tooltip,
    phone: helptext.phone.tooltip,
    category: helptext.type.tooltip,
    environment: helptext.environment.tooltip,
    criticality: helptext.criticality.tooltip,
    title: helptext.title.tooltip,
    attach_debug: helptext.attach_debug.tooltip,
  };

  constructor(
    private formBuilder: FormBuilder,
    private translate: TranslateService,
    private validatorsService: IxValidatorsService,
    private feedbackService: FeedbackService,
    private router: Router,
    private imageValidator: ImageValidatorService,
    private formErrorHandler: FormErrorHandlerService,
    @Inject(WINDOW) private window: Window,
    private api: ApiService,
  ) {
    this.getSystemFileSizeLimit();
  }

  onUserGuidePressed(): void {
    this.window.open('https://www.truenas.com/docs/hub/');
  }

  onEulaPressed(): void {
    this.router.navigate(['system', 'support', 'eula']).then(() => {
      this.dialogRef().close();
    });
  }

  onSubmit(): void {
    this.isLoadingChange.emit(true);

    this.feedbackService.createTicketLicensed(this.form.value).pipe(
      finalize(() => this.isLoadingChange.emit(false)),
      untilDestroyed(this),
    ).subscribe({
      next: (createdTicket) => this.onSuccess(createdTicket.url),
      error: (error: unknown) => this.formErrorHandler.handleValidationErrors(error, this.form),
    });
  }

  private onSuccess(ticketUrl: string): void {
    this.feedbackService.showTicketSuccessMsg(ticketUrl);
    this.dialogRef().close();
  }

  private getSystemFileSizeLimit(): void {
    this.api.call('support.attach_ticket_max_size').pipe(untilDestroyed(this)).subscribe((size) => {
      this.form.controls.images.addAsyncValidators(
        this.imageValidator.getImagesValidator(size * MiB),
      );
      this.form.controls.images.updateValueAndValidity();
    });
  }
}
