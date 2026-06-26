import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCardComponent,
  TnCardHeaderDirective,
  TnListComponent,
  TnListItemComponent,
  type TnCardAction,
} from '@truenas/ui-components';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { AuthService } from 'app/modules/auth/auth.service';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { guiCardElements } from 'app/pages/system/general-settings/gui/gui-card/gui-card.elements';
import { GuiFormComponent } from 'app/pages/system/general-settings/gui/gui-form/gui-form.component';
import { AppState } from 'app/store';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-gui-card',
  styleUrls: ['./../../common-settings-card.scss'],
  templateUrl: './gui-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardHeaderDirective,
    TnListComponent,
    TnListItemComponent,
    UiSearchDirective,
    WithLoadingStateDirective,
    TranslateModule,
  ],
})
export class GuiCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private slideIn = inject(SlideIn);
  private authService = inject(AuthService);
  private translate = inject(TranslateService);

  protected readonly searchableElements = guiCardElements;

  readonly generalConfig$ = this.store$.pipe(
    waitForGeneralConfig,
    toLoadingState(),
  );

  readonly helptext = helptext;

  private hasSettingsRole = toSignal(
    this.authService.hasRole([Role.SystemGeneralWrite]),
    { initialValue: false },
  );

  protected settingsAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasSettingsRole()) {
      return undefined;
    }

    return {
      label: this.translate.instant('Settings'),
      testId: 'gui-settings',
      handler: () => this.openSettings(),
    };
  });

  openSettings(): void {
    this.slideIn.open(GuiFormComponent);
  }
}
