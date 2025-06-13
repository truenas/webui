import {
  ChangeDetectionStrategy, Component, computed, input, OnChanges, signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { finalize, timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { auditEventLabels } from 'app/enums/audit.enum';
import { AuditEntry } from 'app/interfaces/audit/audit.interface';
import { IxDateComponent } from 'app/modules/dates/pipes/ix-date/ix-date.component';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UrlOptionsService } from 'app/services/url-options.service';

@UntilDestroy()
@Component({
  selector: 'ix-user-last-action',
  templateUrl: './user-last-action.component.html',
  styleUrls: ['./user-last-action.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TestDirective,
    NgxSkeletonLoaderModule,
    RouterLink,
    MapValuePipe,
    IxDateComponent,
  ],
})
export class UserLastActionComponent implements OnChanges {
  username = input.required<string>();

  protected isLoading = signal(true);
  protected lastAction = signal<AuditEntry | null>(null);

  protected auditLink = computed(() => {
    return this.urlOptions.buildUrl('/system/audit', {
      searchQuery: {
        isBasicQuery: false,
        filters: [['username', '=', this.username()]],
      },
    });
  });

  protected readonly eventLabels = auditEventLabels;

  constructor(
    private api: ApiService,
    private urlOptions: UrlOptionsService,
    private errorHandler: ErrorHandlerService,
  ) {}

  ngOnChanges(): void {
    this.isLoading.set(true);
    // The delay is here to make sure we are not spamming the API if user is quickly switching between users.
    timer(300)
      .pipe(
        switchMap(() => {
          return this.api.call('audit.query', [{
            'query-filters': [['username', '=', this.username()]],
            'query-options': { limit: 1, order_by: ['-message_timestamp'] },
          }]);
        }),
        finalize(() => this.isLoading.set(false)),
        this.errorHandler.withErrorHandler(),
        untilDestroyed(this),
      )
      .subscribe((entries: AuditEntry[]) => {
        this.lastAction.set(entries[0]);
      });
  }
}
