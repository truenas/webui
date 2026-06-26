import {
  ChangeDetectionStrategy, Component, DestroyRef, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
} from '@truenas/ui-components';
import { Subject } from 'rxjs';
import {
  distinctUntilChanged, map, shareReplay, startWith, switchMap, take, tap, withLatestFrom,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { kernelCardElements } from 'app/pages/system/advanced/kernel/kernel-card/kernel-card.elements';
import { getKernelFormConfig } from 'app/pages/system/advanced/kernel/kernel-form/kernel.form-config';
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
    UiSearchDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    WithLoadingStateDirective,
    TranslateModule,
  ],
})
export class KernelCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private destroyRef = inject(DestroyRef);

  private readonly reloadConfig$ = new Subject<void>();
  protected readonly searchableElements = kernelCardElements;
  protected readonly requiredRoles = [Role.SystemAdvancedWrite];

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

  onConfigurePressed(): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      withLatestFrom(this.store$.pipe(waitForAdvancedConfig, take(1))),
      switchMap(([, config]) => this.formPanel.openForm(getKernelFormConfig(this.api, this.translate, this.store$), {
        title: this.translate.instant('Kernel'),
        editData: { debugkernel: config.debugkernel },
      }).success$),
      tap(() => this.reloadConfig$.next()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }
}
