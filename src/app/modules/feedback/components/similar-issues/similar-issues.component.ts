import { AsyncPipe } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, OnChanges,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { sortBy, uniqBy } from 'lodash-es';
import {
  BehaviorSubject, Observable, debounceTime, distinctUntilChanged, filter, pairwise, switchMap,
} from 'rxjs';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { SimilarIssue } from 'app/modules/feedback/interfaces/file-ticket.interface';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-similar-issues',
  styleUrls: ['./similar-issues.component.scss'],
  templateUrl: './similar-issues.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    TestDirective,
    IxIconComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SimilarIssuesComponent implements OnChanges {
  readonly query = input.required<string>();

  protected similarIssues$ = new BehaviorSubject<SimilarIssue[]>([]);
  protected isLoading$ = new BehaviorSubject<boolean>(false);
  private query$ = new BehaviorSubject<string>('');

  protected readonly jiraHostname = 'https://ixsystems.atlassian.net';

  constructor(
    private feedbackService: FeedbackService,
  ) {
    this.listenForQueryChanges();
  }

  ngOnChanges(changes: IxSimpleChanges<this>): void {
    if ('query' in changes) {
      this.query$.next(this.query());
    }
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
        const combinedUniqueIssues = sortBy(uniqBy([
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
