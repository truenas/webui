import { Component, Input } from '@angular/core';

@Component({
  selector: 'text-limiter-tooltip',
  template: `<div class="tooltip-container">
              <div class="html-tooltip" [innerHTML]="html"></div>
            </div>`,
  styleUrls: ['./html-tooltip.directive.scss'],
})

export class HtmlTooltipComponent {
  @Input() html = '';
}
