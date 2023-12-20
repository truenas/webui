import {
  Component,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UntilDestroy } from '@ngneat/until-destroy';
import {
  debounceTime, distinctUntilChanged, filter, map, switchMap,
} from 'rxjs';
import { helptextSystemSupport as helptext } from 'app/helptext/system/support';
import {
  CreateNewTicket,
} from 'app/modules/ix-feedback/interfaces/file-ticket.interface';
import { IxFeedbackService } from 'app/modules/ix-feedback/ix-feedback.service';

@UntilDestroy()
@Component({
  templateUrl: './file-ticket-form.component.html',
  styleUrls: ['./file-ticket-form.component.scss'],
})
export class FileTicketFormComponent {
  title = new FormControl<string>('', [Validators.required]);
  similarTickets$ = this.title.valueChanges.pipe(
    filter(() => Boolean(this.feedback.getOauthToken())),
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((query) => this.feedback.findSimilarTickets(query)),
    map((tickets) => tickets.slice(0, 5)),
  );

  readonly tooltips = {
    title: helptext.title.tooltip,
  };

  constructor(
    private feedback: IxFeedbackService,
    private sanitizer: DomSanitizer,
  ) {}

  sanitizeHtml(url: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(url);
  }

  getPayload(): Partial<CreateNewTicket> {
    return {
      title: this.title.value,
    };
  }
}
