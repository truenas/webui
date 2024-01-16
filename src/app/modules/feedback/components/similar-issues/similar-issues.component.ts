import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import {
  BehaviorSubject, combineLatest, debounceTime, distinctUntilChanged, filter, map, switchMap,
} from 'rxjs';
import { FeedbackService } from 'app/modules/feedback/feedback.service';

@Component({
  selector: 'ix-similar-issues',
  styleUrls: ['./similar-issues.component.scss'],
  templateUrl: './similar-issues.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SimilarIssuesComponent {
  @Input() set query(value: string) {
    this.query$.next(value);
  }

  private query$ = new BehaviorSubject<string>(null);

  // TODO: Check if querying for every word would be better
  protected similarIssues$ = this.query$.pipe(
    filter(Boolean),
    filter((query) => query.length > 3),
    debounceTime(500),
    distinctUntilChanged(),
    switchMap((query) => this.feedbackService.getSimilarIssues(query)),
  );
  protected hasSimilarIssues$ = combineLatest([
    this.query$,
    this.similarIssues$,
  ]).pipe(
    map(([title, issues]) => {
      if (title.length > 3) {
        return issues;
      }
      return [];
    }),
  );

  protected readonly jiraHostname = 'https://ixsystems.atlassian.net';

  constructor(
    private feedbackService: FeedbackService,
  ) {}
}
