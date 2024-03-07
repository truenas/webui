import {
  ChangeDetectionStrategy,
  Component, EventEmitter, Input, Output,
} from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { finalize } from 'rxjs';
import { MiB } from 'app/constants/bytes.constant';
import { TicketType, ticketAcceptedFiles } from 'app/enums/file-ticket.enum';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { FeedbackDialogComponent } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { FeedbackType } from 'app/modules/feedback/interfaces/feedback.interface';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { ImageValidatorService } from 'app/modules/ix-forms/validators/image-validator/image-validator.service';
import { OauthButtonType } from 'app/modules/oauth-button/interfaces/oauth-button.interface';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  selector: 'ix-file-ticket',
  styleUrls: ['./file-ticket.component.scss'],
  templateUrl: './file-ticket.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTicketComponent {
  @Input() type: FeedbackType.Bug | FeedbackType.Suggestion;
  @Input() dialogRef: MatDialogRef<FeedbackDialogComponent>;
  @Input() isLoading: boolean;
  @Output() isLoadingChange = new EventEmitter<boolean>();

  protected form = this.formBuilder.group({
    title: ['', [Validators.maxLength(200)]],
    message: ['', [Validators.maxLength(20000)]],
    images: [[] as File[], []],
    attach_debug: [true],
    attach_images: [false],
    take_screenshot: [true],
  });

  protected OauthButtonType = OauthButtonType;
  protected readonly oauthUrl = 'https://support-proxy.ixsystems.com/oauth/initiate?origin=';
  protected readonly messagePlaceholder = helptext.bug.message.placeholder;
  protected readonly acceptedFiles = ticketAcceptedFiles;

  protected readonly tooltips = {
    title: helptext.title.tooltip,
    attach_debug: helptext.attach_debug.tooltip,
  };

  private get ticketType(): TicketType {
    return this.type === FeedbackType.Bug ? TicketType.Bug : TicketType.Suggestion;
  }

  constructor(
    private formBuilder: FormBuilder,
    private feedbackService: FeedbackService,
    private imageValidator: ImageValidatorService,
    private formErrorHandler: FormErrorHandlerService,
    private ws: WebSocketService,
  ) {
    this.getSystemFileSizeLimit();
  }

  onSubmit(token: string): void {
    this.isLoadingChange.emit(true);

    this.feedbackService.createTicket(token, this.ticketType, this.form.value).pipe(
      finalize(() => this.isLoadingChange.emit(false)),
      untilDestroyed(this),
    ).subscribe({
      next: (createdTicket) => this.onSuccess(createdTicket.url),
      error: (error) => this.formErrorHandler.handleWsFormError(error, this.form),
    });
  }

  private onSuccess(ticketUrl: string): void {
    this.feedbackService.showTicketSuccessMsg(ticketUrl);
    this.dialogRef.close();
  }

  private getSystemFileSizeLimit(): void {
    this.ws.call('support.attach_ticket_max_size').pipe(untilDestroyed(this)).subscribe((size) => {
      this.form.controls.images.addAsyncValidators(this.imageValidator.getImagesValidator(size * MiB));
      this.form.controls.images.updateValueAndValidity();
    });
  }
}
