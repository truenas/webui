import {
  Component, Input, ViewChild, ElementRef, ViewEncapsulation,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { IxAbstractObject } from 'app/core/classes/ix-abstract-object';

@Component({
  selector: 'toolbar-input',
  styleUrls: ['toolbar-input.component.scss'],
  templateUrl: './toolbar-input.component.html',
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
})
export class ToolbarInputComponent extends IxAbstractObject {
  @Input() config?: any;
  @Input() controller: Subject<any>;

  @ViewChild('filter', { static: false }) filter: ElementRef;
  filterValue = '';
  hasFocus = false;
  constructor(public translate: TranslateService) {
    super();
  }

  reset(): void {
    this.filterValue = '';
    this.filter.nativeElement.value = '';
    this.send();
  }

  onChange(): void {
    this.filterValue = this.filter.nativeElement.value ? this.filter.nativeElement.value : '';
    this.send();
  }

  send(): void {
    this.config.value = this.filterValue;
    this.controller.next({ name: this.config.name, value: this.config.value });
  }

  onFocus(): void {
    this.hasFocus = true;
  }

  onBlur(): void {
    this.hasFocus = false;
  }

  isShowPlaceholder(): boolean {
    return this.config.placeholder && !this.hasFocus && !this.filterValue;
  }
}
