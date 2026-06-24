import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  Subject, shareReplay, startWith, switchMap, tap,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { auditCardElements } from 'app/pages/system/advanced/audit/audit-card/audit-card.elements';
import { getAuditFormConfig } from 'app/pages/system/advanced/audit/audit-form/audit.form-config';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { AppState } from 'app/store';

@Component({
  selector: 'ix-audit-card',
  styleUrls: ['../../../general-settings/common-settings-card.scss'],
  templateUrl: './audit-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    MatList,
    MatListItem,
    WithLoadingStateDirective,
    TranslateModule,
  ],
})
export class AuditCardComponent {
  private formPanel = inject(FormSidePanelService);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private store$ = inject<Store<AppState>>(Store);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private destroyRef = inject(DestroyRef);

  private readonly reloadConfig$ = new Subject<void>();
  protected readonly searchableElements = auditCardElements;
  protected readonly requiredRoles = [Role.SystemAuditWrite];
  auditConfig$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.api.call('audit.config')),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.formPanel.openForm(getAuditFormConfig(this.api, this.translate, this.store$), {
        title: this.translate.instant('Audit'),
      }).success$),
      tap(() => {
        this.reloadConfig$.next();
      }),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  getEndValue(value: number, processedString: string): string {
    if (!value) {
      return this.translate.instant('None');
    }
    return this.translate.instant(processedString, { value });
  }
}
