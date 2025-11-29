import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import {
  distinctUntilChanged, filter, map, shareReplay, startWith, switchMap, tap,
} from 'rxjs/operators';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { nvidiaDriversCardElements } from 'app/pages/system/advanced/nvidia-drivers/nvidia-drivers-card/nvidia-drivers-card.elements';
import { NvidiaDriversFormComponent } from 'app/pages/system/advanced/nvidia-drivers/nvidia-drivers-form/nvidia-drivers-form.component';
import { FirstTimeWarningService } from 'app/services/first-time-warning.service';
import { AppState } from 'app/store';
import { waitForAdvancedConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-nvidia-drivers-card',
  styleUrls: ['./nvidia-drivers-card.component.scss', '../../../general-settings/common-settings-card.scss'],
  templateUrl: './nvidia-drivers-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
  imports: [
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    WithLoadingStateDirective,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    MatList,
    MatListItem,
    TranslateModule,
  ],
})
export class NvidiaDriversCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private slideIn = inject(SlideIn);
  private firstTimeWarning = inject(FirstTimeWarningService);

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
      switchMap(() => this.slideIn.open(NvidiaDriversFormComponent, { data: nvidiaEnabled })),
      filter((response) => !!response.response),
      tap(() => this.reloadConfig$.next()),
      untilDestroyed(this),
    ).subscribe();
  }
}
