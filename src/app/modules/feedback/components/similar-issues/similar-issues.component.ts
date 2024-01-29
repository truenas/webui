import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import {
  BehaviorSubject, Observable, debounceTime, distinctUntilChanged, filter, pairwise, switchMap,
} from 'rxjs';
import { SimilarIssue } from 'app/modules/feedback/interfaces/file-ticket.interface';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';

@UntilDestroy()
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

  protected similarIssues$ = new BehaviorSubject<SimilarIssue[]>([]);
  protected isLoading$ = new BehaviorSubject<boolean>(false);
  private query$ = new BehaviorSubject<string>(null);

  protected readonly jiraHostname = 'https://ixsystems.atlassian.net';

  constructor(
    private feedbackService: FeedbackService,
  ) {
    this.listenForQueryChanges();
  }

  private listenForQueryChanges(): void {
    this.query$.pipe(
      filter((query) => query?.length >= 3),
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((query) => this.fetchAndCombineSimilarIssues(query)),
      untilDestroyed(this),
    ).subscribe();

    this.query$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      pairwise(),
      untilDestroyed(this),
    ).subscribe(([oldQuery, newQuery]) => {
      if (!newQuery?.length) {
        this.similarIssues$.next([]);
      }
      if (oldQuery?.length && newQuery?.length) {
        const resetSimilarIssues = !newQuery.trim().includes(oldQuery);
        if (resetSimilarIssues) {
          this.similarIssues$.next([]);
        }
      }
    });
  }

  private fetchAndCombineSimilarIssues(query: string): Observable<SimilarIssue[]> {
    this.isLoading$.next(true);
    return this.feedbackService.getSimilarIssues(query).pipe(
      switchMap((newIssues) => {
        const combinedUniqueIssues = _.sortBy(_.uniqBy([
          ...this.similarIssues$.value,
          ...newIssues,
        ], 'id'), { summaryText: query });
        this.similarIssues$.next(combinedUniqueIssues);
        this.isLoading$.next(false);
        return this.similarIssues$;
      }),
    );
  }
}
