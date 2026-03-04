import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatCard, MatCardContent } from '@angular/material/card';
import { MatList, MatListItem } from '@angular/material/list';
import { MatToolbarRow } from '@angular/material/toolbar';
import { Store } from '@ngrx/store';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { Option } from 'app/interfaces/option.interface';
import { SystemGeneralConfig } from 'app/interfaces/system-config.interface';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { localizationCardElements } from 'app/pages/system/general-settings/localization/localization-card/localization-card.elements';
import { LocalizationFormComponent } from 'app/pages/system/general-settings/localization/localization-form/localization-form.component';
import { SystemGeneralService } from 'app/services/system-general.service';
import { AppState } from 'app/store';
import { waitForGeneralConfig } from 'app/store/system-config/system-config.selectors';

@Component({
  selector: 'ix-localization-card',
  styleUrls: ['./../../common-settings-card.scss'],
  templateUrl: './localization-card.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
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
export class LocalizationCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private slideIn = inject(SlideIn);
  private sysGeneralService = inject(SystemGeneralService);

  protected readonly searchableElements = localizationCardElements;
  protected readonly requiredRoles = [Role.SystemGeneralWrite];

  readonly generalConfig$ = this.store$.pipe(
    waitForGeneralConfig,
    toLoadingState(),
  );

  readonly mapChoices$ = this.sysGeneralService.kbdMapChoices().pipe(
    toLoadingState(),
  );

  readonly helptext = helptext;

  getKeyboardMapValue(mapChoices: Option[], config: SystemGeneralConfig): string {
    const keyboardMap = mapChoices.find((option) => option.value === config.kbdmap);
    return config.kbdmap && keyboardMap?.label ? keyboardMap.label : helptext.default;
  }

  openSettings(config: SystemGeneralConfig): void {
    this.slideIn.open(LocalizationFormComponent, {
      data: {
        kbdMap: config.kbdmap,
        timezone: config.timezone,
      },
    });
  }
}
