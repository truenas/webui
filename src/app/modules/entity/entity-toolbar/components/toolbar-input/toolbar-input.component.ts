import {
  Component, Input, ViewChild, ElementRef, ViewEncapsulation,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { ControlConfig } from 'app/modules/entity/entity-toolbar/models/control-config.interface';
import { Control } from 'app/modules/entity/entity-toolbar/models/control.interface';

@Component({
  selector: 'toolbar-input',
  styleUrls: ['toolbar-input.component.scss'],
  templateUrl: './toolbar-input.component.html',
  // eslint-disable-next-line @angular-eslint/use-component-view-encapsulation
  encapsulation: ViewEncapsulation.None,
})
export class ToolbarInputComponent {
  @Input() config?: ControlConfig;
  @Input() controller: Subject<Control>;

  @ViewChild('filter', { static: false }) filter: ElementRef;
  filterValue = '';
  hasFocus = false;
  constructor(public translate: TranslateService) {}

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
