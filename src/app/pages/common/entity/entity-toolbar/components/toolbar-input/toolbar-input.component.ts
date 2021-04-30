import {
  Component, Input, ViewChild, ElementRef, ViewEncapsulation,
} from '@angular/core';
import { FormGroup } from '@angular/forms';
import { TranslateService } from '@ngx-translate/core';
import { iXAbstractObject } from 'app/core/classes/ix-abstractobject';

import { Control } from '../../models/control.interface';
import { ControlConfig } from '../../models/control-config.interface';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'toolbar-input',
  styleUrls: ['toolbar-input.component.scss'],
  template: `
    <div class="toolbar-input form-element" id="row-filter">
      <div class="toolbar-input-placeholder" *ngIf="isShowPlaceholder()">{{ config.placeholder }}</div>
      <mat-form-field>
        <span matPrefix style="cursor: default; user-select: none;"><mat-icon>search</mat-icon></span>
        <mat-label>{{config.placeholder}}</mat-label>
        <input matInput #filter class="mat-input-element" [value]="config.value" (focus)="onFocus()"
          ix-auto (change)="onChange()" (input)="onChange()" [placeholder]="config.placeholder" (blur)="onBlur()"
          ix-auto-type="input">
        <span [ngClass]="{'invisible': !filterValue || filterValue.length == 0}" matSuffix style="cursor: pointer; user-select: none;">
          <mat-icon (click)="reset()" role="img" fontSet="mdi-set" fontIcon="mdi-close-circle"></mat-icon>
        </span>
      </mat-form-field>
    </div>
  `,
  encapsulation: ViewEncapsulation.None,
})
export class ToolbarInputComponent extends iXAbstractObject {
  @Input() config?: any;
  @Input() controller: Subject<any>;

  @ViewChild('filter', { static: false }) filter: ElementRef;
  filterValue = '';
  hasFocus = false;
  constructor(public translate: TranslateService) {
    super();
  }

  reset() {
    this.filterValue = '';
    this.filter.nativeElement.value = '';
    this.send();
  }

  onChange() {
    this.filterValue = this.filter.nativeElement.value ? this.filter.nativeElement.value : '';
    this.send();
  }

  send() {
    this.config.value = this.filterValue;
    this.controller.next({ name: this.config.name, value: this.config.value });
  }

  onFocus() {
    this.hasFocus = true;
  }

  onBlur() {
    this.hasFocus = false;
  }

  isShowPlaceholder() {
    return this.config.placeholder && !this.hasFocus && !this.filterValue;
  }
}
