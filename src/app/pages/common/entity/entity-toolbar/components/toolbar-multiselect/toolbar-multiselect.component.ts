import {
  Component, ViewChild, Input, OnInit,
} from '@angular/core';
import { MatSelect } from '@angular/material/select';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { IxAbstractObject } from 'app/core/classes/ix-abstract-object';
import { ControlConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { Control } from 'app/pages/common/entity/entity-toolbar/models/control.interface';

@Component({
  selector: 'toolbar-multiselect',
  templateUrl: './toolbar-multiselect.component.html',
  styleUrls: ['./toolbar-multiselect.component.scss'],
})
export class ToolbarMultiSelectComponent extends IxAbstractObject implements OnInit {
  @ViewChild('selectTrigger') mySel: MatSelect;
  @Input() config?: ControlConfig;
  @Input() controller: Subject<Control>;
  allSelected: boolean = null;
  values: any[] = [];
  selectStates: boolean [] = [];

  constructor(public translate: TranslateService) {
    super();
  }

  ngOnInit(): void {
    this.selectStates.length = this.config.options.length;
    this.selectStates.fill(false);

    if (this.config.value) {
      this.values = this.config.value;
      this.config.value.forEach((value: any) => {
        const index = this.config.options.indexOf(value);

        if (index >= 0) {
          this.selectStates[index] = true;
        }
      });
    } else {
      this.values.push(this.config.options[0]);
      this.selectStates[0] = true;
    }
    this.updateController();
  }

  onClick(value: any, index: number): void {
    if (this.selectStates[index]) {
      if (this.checkLength()) { this.allSelected = false; }
      const vIndex = this.values.indexOf(value);
      this.values.splice(vIndex, 1);
      this.mySel.options.forEach((item) => item.deselect());
    } else {
      this.values.push(value);
      this.mySel.options.forEach((item) => item.select());
    }
    this.mySel.close();
    this.selectStates[index] = !this.selectStates[index];
    this.updateController();
  }

  updateController(): void {
    this.config.value = this.values;
    const message: Control = { name: this.config.name, value: this.values };
    this.controller.next(message);
  }

  checkLength(): boolean {
    return this.values.length === this.selectStates.length;
  }

  checkAll(): void {
    this.allSelected = this.checkLength();
    if (!this.allSelected) {
      this.selectStates.fill(true);
      this.values = Object.assign([], this.config.options);
    } else {
      this.selectStates.fill(false);
      this.values = [];
    }
    this.updateController();
  }

  isChecked(): boolean {
    return true;
  }

  onChangeOption(): void {
  }
}
