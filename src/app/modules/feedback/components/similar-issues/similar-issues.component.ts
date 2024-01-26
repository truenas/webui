import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import _ from 'lodash';
import {
  BehaviorSubject, Observable, debounceTime, distinctUntilChanged, filter, map, pairwise, switchMap,
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

  protected areResultsOutdated$ = new BehaviorSubject<boolean>(false);
  protected similarIssues$ = new BehaviorSubject<SimilarIssue[]>([]);
  private query$ = new BehaviorSubject<string>(null);

  protected getSimilarIssues$ = this.query$.pipe(
    filter((query) => query?.split(' ').length > 1),
    debounceTime(300),
    distinctUntilChanged(),
    switchMap((query) => this.fetchAndCombineSimilarIssues(query)),
  );

  protected isQueryDrasticallyChanged$ = this.query$.pipe(
    debounceTime(500),
    distinctUntilChanged(),
    pairwise(),
    map(([oldQuery, newQuery]) => {
      if (!newQuery?.length) {
        this.similarIssues$.next([]);
        return true;
      }
      if (oldQuery?.length && newQuery?.length) {
        const isQueryDrasticallyChanged = !newQuery.includes(oldQuery);
        if (isQueryDrasticallyChanged) {
          this.similarIssues$.next([]);
        }
        return isQueryDrasticallyChanged;
      }
      return false;
    }),
  );

  protected readonly jiraHostname = 'https://ixsystems.atlassian.net';

  constructor(
    private feedbackService: FeedbackService,
  ) {
    this.isQueryDrasticallyChanged$.pipe(untilDestroyed(this)).subscribe();
    this.getSimilarIssues$.pipe(untilDestroyed(this)).subscribe();
  }

  private fetchAndCombineSimilarIssues(query: string): Observable<SimilarIssue[]> {
    this.areResultsOutdated$.next(true);
    return this.feedbackService.getSimilarIssues(query).pipe(
      switchMap((newIssues) => {
        const combinedUniqueIssues = _.uniqBy([...this.similarIssues$.value, ...newIssues], 'id');
        this.similarIssues$.next(combinedUniqueIssues);
        this.areResultsOutdated$.next(false);
        return this.similarIssues$;
      }),
    );
  }
}
