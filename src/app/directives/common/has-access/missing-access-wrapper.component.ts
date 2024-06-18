import {
  ChangeDetectionStrategy, Component, Input, TemplateRef,
} from '@angular/core';

@Component({
  selector: 'ix-missing-access-wrapper',
  templateUrl: './missing-access-wrapper.component.html',
  styleUrls: ['./missing-access-wrapper.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MissingAccessWrapperComponent {
  @Input() template: TemplateRef<HTMLElement>;
  @Input() class: string;
}
