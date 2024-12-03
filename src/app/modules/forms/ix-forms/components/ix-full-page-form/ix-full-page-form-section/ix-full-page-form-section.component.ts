import {
  ChangeDetectionStrategy, Component, Input,
} from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';

@UntilDestroy()
@Component({
  selector: 'ix-full-page-form-section',
  styleUrls: ['./ix-full-page-form-section.component.scss'],
  templateUrl: './ix-full-page-form-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxFieldsetComponent,
    MatDivider,
    TranslateModule,
  ],
})
export class IxFullPageFormSectionComponent {
  @Input() help: string;
  @Input() label: string;
}
