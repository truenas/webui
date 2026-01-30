import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy, Component, input, TemplateRef,
} from '@angular/core';
import { MatTooltip } from '@angular/material/tooltip';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { DisableFocusableElementsDirective } from 'app/directives/disable-focusable-elements/disable-focusable-elements.directive';

@Component({
  selector: 'ix-missing-access-wrapper',
  templateUrl: './missing-access-wrapper.component.html',
  styleUrls: ['./missing-access-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DisableFocusableElementsDirective,
    MatTooltip,
    NgTemplateOutlet,
    TranslateModule,
    TnIconComponent,
  ],
})
export class MissingAccessWrapperComponent {
  readonly template = input.required<TemplateRef<HTMLElement>>();
  readonly class = input<string>();
}
