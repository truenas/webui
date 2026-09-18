import { AsyncPipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, input, OnChanges, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent, TnTestIdDirective } from '@truenas/ui-components';
import { sortBy, uniqBy } from 'lodash-es';
import {
  BehaviorSubject, Observable, debounceTime, distinctUntilChanged, filter, map, pairwise, switchMap,
} from 'rxjs';
import { IxSimpleChanges } from 'app/interfaces/simple-changes.interface';
import { SimilarIssue } from 'app/modules/feedback/interfaces/file-ticket.interface';
import { FeedbackService } from 'app/modules/feedback/services/feedback.service';
import { normalizeTestIdParts } from 'app/modules/test-id/normalize-test-id.utils';

@Component({
  selector: 'ix-similar-issues',
  styleUrls: ['./similar-issues.component.scss'],
  templateUrl: './similar-issues.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnTestIdDirective,
    TnIconComponent,
    TranslateModule,
    AsyncPipe,
  ],
})
export class SimilarIssuesComponent implements OnChanges {
  private feedbackService = inject(FeedbackService);
  private destroyRef = inject(DestroyRef);

  readonly query = input.required<string>();

  protected similarIssues$ = new BehaviorSubject<SimilarIssue[]>([]);
  protected isLoading$ = new BehaviorSubject<boolean>(false);
  private query$ = new BehaviorSubject<string>('');

  protected readonly jiraHostname = 'https://ixsystems.atlassian.net';

  /**
   * Issue keys carry digits (`NAS-143893`), and the library's kebab-casing does not split a
   * letter→digit boundary the way lodash does — so the key is pre-normalized here to keep
   * `link-similar-issue-nas-143893` byte-identical. Normalizing as the issues arrive, rather than
   * from the template, also keeps the array out of every change-detection pass.
   * See {@link normalizeTestIdParts}.
   */
  protected readonly similarIssueLinks$ = this.similarIssues$.pipe(
    map((issues) => issues.map((issue) => ({
      issue,
      testId: normalizeTestIdParts(['similar-issue', issue.id]),
    }))),
  );

  constructor() {
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
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();

    this.query$.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      pairwise(),
      takeUntilDestroyed(this.destroyRef),
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
