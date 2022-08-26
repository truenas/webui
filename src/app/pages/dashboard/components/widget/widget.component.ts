import {
  Component, Input, Output, EventEmitter,
} from '@angular/core';
import { NgForm } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';

@Component({
  template: '',
})
export class WidgetComponent {
  @Input() widgetSize: string;
  @Input() rendered?: boolean = true;
  @Input() configurable = false;
  @Input() showReorderHandle = false;
  @Output() back = new EventEmitter();
  title: string = this.translate.instant('Widget Base Class');

  flipAnimation = 'stop';
  flipDirection = 'vertical';
  isFlipped = false;

  constructor(
    public translate: TranslateService,
  ) {}

  toggleConfig(): void {
    if (this.isFlipped) {
      this.flipAnimation = 'unflip';
    } else {
      this.flipAnimation = 'flip';
    }

    if (this.flipDirection === 'vertical') {
      this.flipAnimation += 'V';
    } else if (this.flipDirection === 'horizontal') {
      this.flipAnimation += 'H';
    }

    this.isFlipped = !this.isFlipped;
  }

  // eslint-disable-next-line unused-imports/no-unused-vars
  setPreferences(form: NgForm): void {
  }

  goBack(): void {
    this.back.emit();
  }
}
