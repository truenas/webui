import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Store } from '@ngrx/store';
import { filter } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { guiCardElements } from 'app/pages/system/general-settings/gui/gui-card/gui-card.elements';
import { GuiFormComponent } from 'app/pages/system/general-settings/gui/gui-form/gui-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';
import { AppsState } from 'app/store';
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
  protected readonly searchableElements = guiCardElements;
  protected readonly requiredRoles = [Role.FullAdmin];

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
    private store$: Store<AppsState>,
    private slideInService: IxSlideInService,
  ) {}

  openSettings(): void {
    const slideInRef = this.slideInService.open(GuiFormComponent);
    slideInRef.slideInClosed$.pipe(
      filter((response) => !response),
      untilDestroyed(this),
    ).subscribe(() => this.store$.dispatch(guiFormClosedWithoutSaving()));
  }
}
