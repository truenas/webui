import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
  TnSidePanelActionDirective, TnSidePanelComponent,
} from '@truenas/ui-components';
import {
  Observable, Subject, of, shareReplay, startWith, switchMap, take,
} from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { auditCardElements } from 'app/pages/system/advanced/audit/audit-card/audit-card.elements';
import { AuditFormComponent } from 'app/pages/system/advanced/audit/audit-form/audit-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';

@Component({
  selector: 'ix-audit-card',
  styleUrls: ['./audit-card.component.scss'],
  templateUrl: './audit-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    WithLoadingStateDirective,
    AuditFormComponent,
    TranslateModule,
  ],
})
export class AuditCardComponent {
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private unsavedChanges = inject(UnsavedChangesService);
  private destroyRef = inject(DestroyRef);

  private readonly reloadConfig$ = new Subject<void>();
  protected readonly searchableElements = auditCardElements;
  protected readonly requiredRoles = [Role.SystemAuditWrite];

  protected configOpen = signal(false);
  protected configForm = viewChild(AuditFormComponent);

  auditConfig$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.api.call('audit.config')),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  protected readonly closeGuard = (): Observable<boolean> => {
    return this.configForm()?.hasUnsavedChanges()
      ? this.unsavedChanges.showConfirmDialog()
      : of(true);
  };

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      take(1),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => this.configOpen.set(true));
  }

  protected onConfigClosed(saved: boolean): void {
    this.configOpen.set(false);
    if (saved) {
      this.reloadConfig$.next();
    }
  }

  getEndValue(value: number, processedString: string): string {
    if (!value) {
      return this.translate.instant('None');
    }
    return this.translate.instant(processedString, { value });
  }
}
