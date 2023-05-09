import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';
import { toLoadingState } from 'app/helpers/to-loading-state.helper';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { GuiFormComponent } from 'app/pages/system/general-settings/gui/gui-form/gui-form.component';
import { IxSlideIn2Service } from 'app/services/ix-slide-in2.service';
import { AppState } from 'app/store';
import { guiFormClosedWithoutSaving } from 'app/store/preferences/preferences.actions';
import { waitForPreferences } from 'app/store/preferences/preferences.selectors';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

@UntilDestroy()
@Component({
  selector: 'ix-gui-card',
  templateUrl: './gui-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuiCardComponent {
  readonly generalConfig$ = this.store$.pipe(
    waitForGeneralConfig,
    toLoadingState(),
  );

  readonly preferences$ = this.store$.pipe(
    waitForPreferences,
    toLoadingState(),
  );

  readonly helptext = helptext;

  constructor(
    private store$: Store<AppState>,
    private slideIn2Service: IxSlideIn2Service,
  ) {}

  doAdd(): void {
    const slideInRef = this.slideIn2Service.open(GuiFormComponent);
    slideInRef.slideInClosed$.pipe(
      filter((response) => !response),
      untilDestroyed(this),
    ).subscribe(() => this.store$.dispatch(guiFormClosedWithoutSaving()));
  }
}
