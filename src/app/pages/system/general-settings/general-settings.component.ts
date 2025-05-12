import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { generalSettingsElements } from 'app/pages/system/general-settings/general-settings.elements';
import { EmailCardComponent } from './email/email-card/email-card.component';
import { GuiCardComponent } from './gui/gui-card/gui-card.component';
import { LocalizationCardComponent } from './localization/localization-card/localization-card.component';
import { SupportCardComponent } from './support/support-card/support-card.component';

@UntilDestroy()
@Component({
  selector: 'ix-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    UiSearchDirective,
    SupportCardComponent,
    GuiCardComponent,
    LocalizationCardComponent,
    EmailCardComponent,
  ],
})
export class GeneralSettingsComponent {
  protected readonly searchableElements = generalSettingsElements;
}
