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
  distinctUntilChanged, map, shareReplay, startWith, switchMap, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { nvidiaDriversCardElements } from 'app/pages/system/advanced/nvidia-drivers/nvidia-drivers-card/nvidia-drivers-card.elements';
import { getNvidiaDriversFormConfig } from 'app/pages/system/advanced/nvidia-drivers/nvidia-drivers-form/nvidia-drivers.form-config';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-nvidia-drivers-card',
  styleUrls: ['./nvidia-drivers-card.component.scss'],
  templateUrl: './nvidia-drivers-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    UiSearchDirective,
    WithLoadingStateDirective,
    RequiresRolesDirective,
    TnButtonComponent,
    TranslateModule,
  ],
})
export class NvidiaDriversCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private api = inject(ApiService);
  private translate = inject(TranslateService);
  private formPanel = inject(FormSidePanelService);
  private firstTimeWarning = inject(FirstTimeWarningService);
  private destroyRef = inject(DestroyRef);

  private readonly reloadConfig$ = new Subject<void>();
  protected readonly searchableElements = nvidiaDriversCardElements;
  protected readonly requiredRoles = [Role.SystemAdvancedWrite];

  readonly nvidiaEnabled$ = this.reloadConfig$.pipe(
    startWith(undefined),
    switchMap(() => this.store$.pipe(waitForAdvancedConfig)),
    distinctUntilChanged((previous, current) => {
      return previous.nvidia === current.nvidia;
    }),
    map((config) => config.nvidia),
    toLoadingState(),
    shareReplay({
      refCount: false,
      bufferSize: 1,
    }),
  );

  onConfigurePressed(nvidiaEnabled: boolean): void {
    this.firstTimeWarning.showFirstTimeWarningIfNeeded().pipe(
      switchMap(() => this.formPanel.openForm(
        getNvidiaDriversFormConfig(this.api, this.translate, this.store$, nvidiaEnabled),
        {
          title: this.translate.instant('NVIDIA Drivers'),
          editData: { nvidia: nvidiaEnabled },
        },
      ).success$),
      tap(() => this.reloadConfig$.next()),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }
}
