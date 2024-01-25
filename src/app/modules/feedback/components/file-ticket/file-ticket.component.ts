import {
  ChangeDetectionStrategy,
  Component, EventEmitter, Input, Output,
} from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  finalize, map, Observable, of, switchMap,
} from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ticketAcceptedFiles, TicketType } from 'app/enums/file-ticket.enum';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import { FeedbackDialogComponent } from 'app/modules/feedback/components/feedback-dialog/feedback-dialog.component';
import { FeedbackType } from 'app/modules/feedback/interfaces/feedback.interface';
import {
  CreateNewTicket,
} from 'app/modules/feedback/interfaces/file-ticket.interface';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { FormErrorHandlerService } from 'app/modules/ix-forms/services/form-error-handler.service';
import { ImageValidatorService } from 'app/modules/ix-forms/validators/image-validator/image-validator.service';
import { OauthButtonType } from 'app/modules/oauth-button/interfaces/oauth-button.interface';
import { DialogService } from 'app/services/dialog.service';

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
    title: [''],
    message: [''],

    images: [[] as File[], [], this.imageValidator.validateImages()],
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

  constructor(
    private formBuilder: FormBuilder,
    private feedbackService: FeedbackService,
    private dialogService: DialogService,
    private translate: TranslateService,
    private imageValidator: ImageValidatorService,
    private formErrorHandler: FormErrorHandlerService,
  ) {}

  onSubmit(token: string): void {
    // TODO: Cache token with setOauthToken inside the button
    this.isLoadingChange.emit(true);

    this.prepareTicket(token).pipe(
      switchMap((ticket) => this.feedbackService.createNewTicket(ticket)),
      switchMap((createdTicket) => {
        return this.addAttachmentsIfNeeded({
          token,
          ticketId: createdTicket.ticket,
        }).pipe(switchMap(() => of(createdTicket)));
      }),
      finalize(() => this.isLoadingChange.emit(false)),
      untilDestroyed(this),
    )
      .subscribe({
        next: (createdTicket) => this.onSuccess(createdTicket.url),
        error: (error) => this.formErrorHandler.handleWsFormError(error, this.form),
      });
  }

  private prepareTicket(token: string): Observable<CreateNewTicket> {
    const values = this.form.value;

    return this.feedbackService.addDebugInfoToMessage(values.message).pipe(
      map((body) => ({
        body,
        token,
        attach_debug: values.attach_debug,
        type: this.type === FeedbackType.Bug ? TicketType.Bug : TicketType.Suggestion,
        title: values.title,
      })),
    );
  }

  private addAttachmentsIfNeeded({ ticketId, token }: { ticketId: number; token: string }): Observable<void> {
    const takeScreenshot = this.form.value.take_screenshot;
    const images = this.form.value.images;

    if (!takeScreenshot && images.length === 0) {
      return of(undefined);
    }

    return this.feedbackService.addTicketAttachments({
      token,
      ticketId,
      takeScreenshot,
      attachments: images,
    }).pipe(
      catchError(() => {
        // Do not fail if attachments were not uploaded.
        this.dialogService.error({
          title: this.translate.instant(helptext.attachmentsFailed.title),
          message: this.translate.instant(helptext.attachmentsFailed.message),
        });

        return of(undefined);
      }),
    );
  }

  private onSuccess(ticketUrl: string): void {
    this.feedbackService.showSnackbar(ticketUrl);
    this.dialogRef.close();
  }
}
