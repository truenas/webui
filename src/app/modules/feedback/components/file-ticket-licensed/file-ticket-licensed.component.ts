import {
  ChangeDetectionStrategy,
  Component, EventEmitter, Inject, Input, Output,
} from '@angular/core';
import { AbstractControl, FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import * as EmailValidator from 'email-validator';
import {
  EMPTY,
  finalize,
  Observable,
  of, switchMap,
} from 'rxjs';
import { catchError, map } from 'rxjs/operators';
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
import { FeedbackService } from 'app/modules/feedback/feedback.service';
import {
  CreateNewTicket,
} from 'app/modules/feedback/interfaces/file-ticket.interface';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { IxValidatorsService } from 'app/modules/ix-forms/services/ix-validators.service';
import { emailValidator } from 'app/modules/ix-forms/validators/email-validation/email-validation';
import { ImageValidatorService } from 'app/modules/ix-forms/validators/image-validator/image-validator.service';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { DialogService } from 'app/services/dialog.service';

@UntilDestroy()
@Component({
  selector: 'ix-file-ticket-licensed',
  styleUrls: ['file-ticket-licensed.component.scss'],
  templateUrl: './file-ticket-licensed.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTicketLicensedComponent {
  @Input() dialogRef: MatDialogRef<FeedbackDialogComponent>;
  @Input() isLoading: boolean;
  @Output() isLoadingChange = new EventEmitter<boolean>();

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
    title: ['', Validators.required],

    message: [''],
    images: [[] as File[], [], this.imageValidator.validateImages()],
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
    private dialogService: DialogService,
    private router: Router,
    private imageValidator: ImageValidatorService,
    private formErrorHandler: FormErrorHandlerService,
    private snackbar: SnackbarService,
    @Inject(WINDOW) private window: Window,
  ) { }

  onUserGuidePressed(): void {
    this.window.open('https://www.truenas.com/docs/hub/');
  }

  onEulaPressed(): void {
    // TODO: Does not close dialog
    this.router.navigate(['system', 'support', 'eula']);
  }

  onSubmit(): void {
    this.isLoadingChange.emit(true);

    this.prepareTicket().pipe(
      switchMap((ticket) => this.feedbackService.createNewTicket(ticket)),
      switchMap((createdTicket) => this.addAttachmentsIfNeeded(createdTicket.ticket)),
      finalize(() => this.isLoadingChange.emit(false)),
      untilDestroyed(this),
    ).subscribe({
      complete: () => this.onSuccess(),
      error: (error) => this.formErrorHandler.handleWsFormError(error, this.form),
    });
  }

  private prepareTicket(): Observable<CreateNewTicket> {
    const values = this.form.value;
    return this.feedbackService.addDebugInfoToMessage(values.message).pipe(
      map((body) => ({
        body,
        name: values.name,
        email: values.email,
        phone: values.phone,
        cc: values.cc,
        environment: values.environment,
        criticality: values.criticality,
        category: values.category,
        title: values.title,
        attach_debug: values.attach_debug,
      })),
    );
  }

  private addAttachmentsIfNeeded(ticketId: number): Observable<unknown> {
    const takeScreenshot = this.form.value.take_screenshot;
    const images = this.form.value.images;

    if (!takeScreenshot && images.length === 0) {
      return EMPTY;
    }

    return this.feedbackService.addAttachmentsToTicket({
      ticketId,
      takeScreenshot,
      attachments: images,
    }).pipe(
      catchError(() => {
        // Do not fail if attachments were not uploaded.
        // TODO: Do differently
        this.dialogService.error({
          title: this.translate.instant(helptext.attachmentsFailed.title),
          message: this.translate.instant(helptext.attachmentsFailed.message),
        });

        return EMPTY;
      }),
    );
  }

  private onSuccess(): void {
    this.snackbar.success(
      this.translate.instant(
        'Thank you for sharing your feedback with us! Your insights are valuable in helping us improve our product.',
      ),
    );
    this.dialogRef.close();
  }
}
