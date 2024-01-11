import {
  Component,
} from '@angular/core';
import { FormControl, Validators } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateService } from '@ngx-translate/core';
import {
  combineLatest,
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
  protected title = new FormControl<string>('', [Validators.required]);
  protected similarIssues$ = this.title.valueChanges.pipe(
    filter(() => Boolean(this.feedback.getOauthToken())),
    filter((query) => query.length > 3),
    debounceTime(500),
    distinctUntilChanged(),
    switchMap((query) => this.feedback.getSimilarIssues(query)),
  );
  protected hasSimilarIssues$ = combineLatest([
    this.title.valueChanges,
    this.similarIssues$,
  ]).pipe(
    map(([title, issues]) => {
      if (title.length > 3) {
        return issues;
      }
      return [];
    }),
  );
  protected readonly hint$ = this.feedback.oauthToken$.pipe(map((token) => {
    if (token) {
      return '';
    }

    return this.translate.instant('Login To Jira first to enable autocomplete feature for similar issues.');
  }));

  readonly tooltips = {
    title: helptext.title.tooltip,
  };

  constructor(
    private feedback: IxFeedbackService,
    private sanitizer: DomSanitizer,
    private translate: TranslateService,
  ) {
    this.feedback.oauthToken$.pipe(
      filter(Boolean),
      untilDestroyed(this),
    ).subscribe(() => {
      this.title.enable();
    });
  }

  sanitizeHtml(url: string): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(url);
  }

  getPayload(): Partial<CreateNewTicket> {
    return {
      title: this.title.value,
    };
  }
}
