import { Component, Input } from '@angular/core';

@Component({
  template: `<div class="tooltip-container">
              <div class="html-tooltip" [innerHTML]="html"></div>
            </div>`,
  styleUrls: ['./html-tooltip.directive.scss'],
})

export class HtmlTooltipComponent {
  @Input() html = '';
}
