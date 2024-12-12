import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { generalSettingsElements } from 'app/pages/system/general-settings/general-settings.elements';
import { EmailCardComponent } from './email/email-card/email-card.component';
import { GuiCardComponent } from './gui/gui-card/gui-card.component';
import { LocalizationCardComponent } from './localization/localization-card/localization-card.component';
import { ManageConfigurationMenuComponent } from './manage-configuration-menu/manage-configuration-menu.component';
import { NtpServerCardComponent } from './ntp-server/ntp-server-card/ntp-server-card.component';
import { SupportCardComponent } from './support/support-card/support-card.component';

@UntilDestroy()
@Component({
  selector: 'ix-general-settings',
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    PageHeaderComponent,
    ManageConfigurationMenuComponent,
    UiSearchDirective,
    SupportCardComponent,
    GuiCardComponent,
    LocalizationCardComponent,
    NtpServerCardComponent,
    EmailCardComponent,
  ],
})
export class GeneralSettingsComponent {
  protected readonly searchableElements = generalSettingsElements;
}
