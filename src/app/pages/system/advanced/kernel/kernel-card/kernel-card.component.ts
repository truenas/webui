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
import { Observable, Subject, of } from 'rxjs';
import {
  distinctUntilChanged, map, shareReplay, startWith, switchMap, take,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { kernelCardElements } from 'app/pages/system/advanced/kernel/kernel-card/kernel-card.elements';
import { KernelFormComponent } from 'app/pages/system/advanced/kernel/kernel-form/kernel-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-kernel-card',
  styleUrls: ['./kernel-card.component.scss'],
  templateUrl: './kernel-card.component.html',
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
    KernelFormComponent,
    TranslateModule,
  ],
})
export class KernelCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private unsavedChanges = inject(UnsavedChangesService);
  private destroyRef = inject(DestroyRef);

  private readonly reloadConfig$ = new Subject<void>();
  protected readonly searchableElements = kernelCardElements;
  protected readonly requiredRoles = [Role.SystemAdvancedWrite];

  protected configOpen = signal(false);
  protected configForm = viewChild(KernelFormComponent);

  readonly debugKernel$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.store$.pipe(waitForAdvancedConfig)),
    distinctUntilChanged((previous, current) => {
      return previous.debugkernel === current.debugkernel;
    }),
    map((config) => config.debugkernel),
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
}
