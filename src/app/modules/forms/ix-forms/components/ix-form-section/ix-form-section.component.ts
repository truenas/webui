import {
  ChangeDetectionStrategy, Component, ElementRef, HostBinding, Input,
} from '@angular/core';
import { MatDivider } from '@angular/material/divider';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';

@UntilDestroy()
@Component({
  selector: 'ix-form-section',
  styleUrls: ['./ix-form-section.component.scss'],
  templateUrl: './ix-form-section.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxFieldsetComponent,
    MatDivider,
    TranslateModule,
  ],
})
export class IxFormSectionComponent {
  @Input() help: string;
  @Input({ required: true }) label: string;

  @HostBinding('attr.id')
  get id(): string {
    return this.label;
  }

  constructor(public elementRef: ElementRef<HTMLElement>) {}
}
