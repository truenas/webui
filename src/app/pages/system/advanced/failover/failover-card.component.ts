import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
} from '@truenas/ui-components';
import { NgxSkeletonLoaderModule } from 'ngx-skeleton-loader';
import { finalize, take } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { FailoverConfig } from 'app/interfaces/failover.interface';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { failoverCardElements } from 'app/pages/system/advanced/failover/failover-card.elements';
import { FailoverFormComponent } from 'app/pages/system/advanced/failover/failover-form/failover-form.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

@Component({
  selector: 'ix-failover-card',
  templateUrl: './failover-card.component.html',
  styleUrls: ['./failover-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnCardComponent,
    TnCardFooterActionsDirective,
    RequiresRolesDirective,
    TranslateModule,
    YesNoPipe,
    NgxSkeletonLoaderModule,
    UiSearchDirective,
  ],
})
export class FailoverCardComponent implements OnInit {
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = failoverCardElements;
  protected readonly requiredRoles = [Role.FailoverWrite];

  protected isLoading = signal(false);
  protected config = signal<FailoverConfig | null>(null);

  ngOnInit(): void {
    this.loadConfig();
  }

  private loadConfig(): void {
    this.isLoading.set(true);

    this.api.call('failover.config')
      .pipe(
        this.errorHandler.withErrorHandler(),
        finalize(() => this.isLoading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((config) => {
        this.config.set(config);
      });
  }

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.formPanel.open(FailoverFormComponent, { title: this.translate.instant('Failover') })
        .onSuccess(() => this.loadConfig(), this.destroyRef);
    });
  }

  // TODO: Add search elements
}
