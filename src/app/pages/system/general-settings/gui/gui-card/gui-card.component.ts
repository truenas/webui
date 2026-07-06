import {
  ChangeDetectionStrategy, Component, Type, inject,
} from '@angular/core';
import { Store } from '@ngrx/store';
import { TranslateService, TranslateModule } from '@ngx-translate/core';
import {
  TnCardComponent,
  TnCardHeaderDirective,
  TnListComponent,
  TnListItemComponent,
  TnButtonComponent,
  TnCardFooterActionsDirective,
} from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { toLoadingState } from 'app/helpers/operators/to-loading-state.helper';
import { helptextSystemGeneral as helptext } from 'app/helptext/system/general';
import { WithLoadingStateDirective } from 'app/modules/loader/directives/with-loading-state/with-loading-state.directive';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { SidePanelForm } from 'app/modules/slide-ins/side-panel-form.directive';
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
    TnButtonComponent,
    TnListItemComponent,
    UiSearchDirective,
    WithLoadingStateDirective,
    TnCardFooterActionsDirective,
    TranslateModule,
    RequiresRolesDirective,
  ],
})
export class GuiCardComponent {
  private store$ = inject<Store<AppState>>(Store);
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);

  protected readonly searchableElements = guiCardElements;
  protected readonly requiredRoles = [Role.SystemGeneralWrite];

  readonly generalConfig$ = this.store$.pipe(
    waitForGeneralConfig,
    toLoadingState(),
  );

  readonly helptext = helptext;

  // GuiFormComponent structurally provides the host surface (closed/canSubmit/submit/
  // hasUnsavedChanges) the panel reads; cast past the nominal base type, mirroring how
  // FormSidePanelService.openForm casts the renderer.
  private readonly guiForm = GuiFormComponent as unknown as Type<SidePanelForm>;

  openSettings(): void {
    this.formPanel.open(this.guiForm, {
      title: this.translate.instant('GUI Settings'),
    });
  }
}
