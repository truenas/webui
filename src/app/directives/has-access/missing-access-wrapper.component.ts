import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, TemplateRef,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { DisableFocusableElementsDirective } from 'app/directives/disable-focusable-elements/disable-focusable-elements.directive';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';

@Component({
  selector: 'ix-missing-access-wrapper',
  templateUrl: './missing-access-wrapper.component.html',
  styleUrls: ['./missing-access-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    DisableFocusableElementsDirective,
    MatTooltip,
    NgTemplateOutlet,
    TranslateModule,
    IxIconComponent,
  ],
})
export class MissingAccessWrapperComponent {
  readonly template = input<TemplateRef<HTMLElement>>();
  readonly class = input<string>();
}
