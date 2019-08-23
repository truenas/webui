import { Component, OnIniti, Input } from '@angular/core';

@Component({
  selector: 'text-limiter-tooltip',
  templateUrl: './text-limiter-tooltip.component.html',
  //template: `{{ text }}`,
  styleUrls: ['./text-limiter-tooltip.component.css']
})
export class TextLimiterTooltipComponent implements OnInit {
  @Input() text = '';

  constructor() { }

  ngOnInit() {
  }

}
