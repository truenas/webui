import { ChangeDetectionStrategy, Component, computed, DestroyRef, input, signal, inject } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { TnTestIdDirective } from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { timer } from 'rxjs';
import {
  defaultIfEmpty, map, switchMap, tap,
} from 'rxjs/operators';
import { AuditEntry, toAuditEntries } from 'app/interfaces/audit/audit.interface';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { normalizeTestIdParts } from 'app/modules/test-id/normalize-test-id.utils';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UrlOptionsService } from 'app/services/url-options.service';

@Component({
  selector: 'ix-user-last-action',
  templateUrl: './user-last-action.component.html',
  styleUrls: ['./user-last-action.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TnTestIdDirective,
    NgxSkeletonLoaderModule,
    RouterLink,
    IxDateComponent,
  ],
})
export class UserLastActionComponent {
  private api = inject(ApiService);
  private urlOptions = inject(UrlOptionsService);
  private errorHandler = inject(ErrorHandlerService);
  private destroyRef = inject(DestroyRef);

  username = input.required<string>();

  protected isLoading = signal(true);
  protected lastAction = signal<AuditEntry | null>(null);

  /**
   * User names carry digits (`admin2`), and the library's kebab-casing does not split a
   * letter→digit boundary the way lodash does — so the name is pre-normalized here to keep
   * `link-search-logs-admin-2` byte-identical. See {@link normalizeTestIdParts}.
   */
  protected testId = computed(() => normalizeTestIdParts(['search-logs', this.username()]));

  protected auditLink = computed(() => {
    return this.urlOptions.buildUrl('/system/audit', {
      searchQuery: {
        isBasicQuery: false,
        filters: [['username', '=', this.username()]],
      },
    });
  });

  constructor() {
    this.loadLastAction();
  }

  /**
   * `switchMap` restarts the delay on every username change, so quickly switching between users sends
   * one request for the user that is left selected, and an older answer cannot replace a newer one.
   */
  private loadLastAction(): void {
    toObservable(this.username).pipe(
      tap(() => this.isLoading.set(true)),
      // The delay is here to make sure we are not spamming the API if user is quickly switching between users.
      switchMap((username) => timer(300).pipe(
        switchMap(() => {
          return this.api.call('audit.query', [{
            'query-filters': [['username', '=', username]],
            'query-options': { limit: 1, order_by: ['-message_timestamp'] },
          }]).pipe(map(toAuditEntries));
        }),
        this.errorHandler.withErrorHandler(),
        // A failed lookup still has to end the loading state, and must not leave the previous user's action up.
        defaultIfEmpty([] as AuditEntry[]),
      )),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe((entries) => {
      this.isLoading.set(false);
      this.lastAction.set(entries[0]);
    });
  }
}
