import {
  ChangeDetectionStrategy, Component, OnInit, signal,
} from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import {
  filter, finalize, switchMap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { FailoverConfig } from 'app/interfaces/failover.interface';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { failoverCardElements } from 'app/pages/system/advanced/failover/failover-card.elements';
import { FailoverFormComponent } from 'app/pages/system/advanced/failover/failover-form/failover-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

@UntilDestroy()
@Component({
  selector: 'ix-failover-card',
  templateUrl: './failover-card.component.html',
  styleUrls: ['./failover-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    MatCard,
    MatCardContent,
    MatList,
    MatListItem,
    MatToolbarRow,
    RequiresRolesDirective,
    TranslateModule,
    TestDirective,
    YesNoPipe,
    NgxSkeletonLoaderModule,
    UiSearchDirective,
  ],
})
export class FailoverCardComponent implements OnInit {
  protected readonly searchableElements = failoverCardElements;
  protected readonly requiredRoles = [Role.FailoverWrite];

  protected isLoading = signal(false);
  protected config = signal<FailoverConfig | null>(null);

  constructor(
    private api: ApiService,
    private errorHandler: ErrorHandlerService,
    private slideIn: SlideIn,
    private firstTimeWarning: FirstTimeWarningService,
  ) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  private loadConfig(): void {
    this.isLoading.set(true);

    this.api.call('failover.config')
      .pipe(
        this.errorHandler.withErrorHandler(),
        finalize(() => this.isLoading.set(false)),
        untilDestroyed(this),
      )
      .subscribe((config) => {
        this.config.set(config);
      });
  }

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.slideIn.open(FailoverFormComponent, { data: this.config() })),
      filter((response) => !!response.response),
      untilDestroyed(this),
    ).subscribe(() => this.loadConfig());
  }

  // TODO: Add search elements
}
