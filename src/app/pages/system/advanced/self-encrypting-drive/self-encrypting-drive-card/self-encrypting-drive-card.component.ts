import {
  ChangeDetectionStrategy, Component, DestroyRef, inject, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
  TnSidePanelActionDirective, TnSidePanelComponent,
} from '@truenas/ui-components';
import { isEqual } from 'lodash-es';
import { Observable, Subject, combineLatest, of } from 'rxjs';
import {
  distinctUntilChanged, map, shareReplay, startWith, switchMap, take,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { sedCardElements } from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-card/self-encrypting-drive-card.elements';
import { SelfEncryptingDriveFormComponent } from 'app/pages/system/advanced/self-encrypting-drive/self-encrypting-drive-form/self-encrypting-drive-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-self-encrypting-drive-card',
  styleUrls: ['./self-encrypting-drive-card.component.scss'],
  templateUrl: './self-encrypting-drive-card.component.html',
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
    SelfEncryptingDriveFormComponent,
    TranslateModule,
  ],
})
export class SelfEncryptingDriveCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private api = inject(ApiService);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private unsavedChanges = inject(UnsavedChangesService);
  private destroyRef = inject(DestroyRef);

  private readonly reloadConfig$ = new Subject<void>();
  protected readonly searchableElements = sedCardElements;
  protected readonly requiredRoles = [Role.SystemAdvancedWrite];

  protected configOpen = signal(false);
  protected configForm = viewChild(SelfEncryptingDriveFormComponent);

  readonly sedConfig$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => {
      const updatedSedUser$ = this.store$.pipe(
        waitForAdvancedConfig,
        distinctUntilChanged((previous, current) => isEqual(previous.sed_user, current.sed_user)),
        map((config) => config.sed_user),
      );
      const updatedSedPassword$ = this.api.call('system.advanced.sed_global_password').pipe(
        map((sedPassword) => '*'.repeat(sedPassword.length) || '–'),
      );
      return combineLatest([
        updatedSedUser$,
        updatedSedPassword$,
      ]);
    }),
    map(([sedUser, sedPassword]) => ({ sedUser, sedPassword })),
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

  onConfigure(): void {
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
}
