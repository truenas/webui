import {
  ChangeDetectionStrategy, Component,
} from '@angular/core';
import { UntilDestroy } from '@ngneat/until-destroy';
import { generalSettingsElements } from 'app/pages/system/general-settings/general-settings.elements';

@UntilDestroy()
@Component({
  templateUrl: './general-settings.component.html',
  styleUrls: ['./general-settings.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralSettingsComponent {
  protected readonly searchableElements = generalSettingsElements;
}
