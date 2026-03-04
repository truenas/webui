import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
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
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
    MatCard,
    UiSearchDirective,
    MatToolbarRow,
    RequiresRolesDirective,
    MatButton,
    TestDirective,
    MatCardContent,
    MatList,
    MatListItem,
    WithLoadingStateDirective,
    TranslateModule,
  ],
})
export class GuiCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private slideIn = inject(SlideIn);
  private destroyRef = inject(DestroyRef);

  protected readonly searchableElements = guiCardElements;
  protected readonly requiredRoles = [Role.SystemGeneralWrite];

  readonly generalConfig$ = this.store$.pipe(
    waitForGeneralConfig,
    toLoadingState(),
  );

  readonly helptext = helptext;

  openSettings(): void {
    this.slideIn.open(GuiFormComponent).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }
}
