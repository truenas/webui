import {
  Component, EventEmitter, Input, OnInit, Output,
} from '@angular/core';
import { getUniqueId } from 'app/helpers/get-unique-id.helper';
import { ControlConfig, ToolbarOption } from 'app/modules/entity/entity-toolbar/models/control-config.interface';

@Component({
  selector: 'ix-toolbar-multimenu',
  styleUrls: ['toolbar-multimenu.component.scss'],
  templateUrl: 'toolbar-multimenu.component.html',
})
export class ToolbarMultimenuComponent implements OnInit {
  @Input() config?: ControlConfig;
  @Output() selectionChange = new EventEmitter<ToolbarOption[]>();

  allSelected = false;
  values: ToolbarOption[] = [];
  selectStates: boolean [] = [];
  id = getUniqueId();

  ngOnInit(): void {
    this.selectStates.length = this.config.options.length;
    this.selectStates.fill(false);
    if (this.config.value) {
      for (const value of this.config.value) {
        if (value) {
          this.values.push(value);
          for (let i = 0; i < this.selectStates.length; i++) {
            if (this.config.options[i].value === value.value) {
              this.selectStates[i] = true;
              break;
            }
          }
        }
      }
    } else {
      this.values.push(this.config.options[0]);
      this.selectStates[0] = true;
    }

    this.updateController();
  }

  onClick(value: ToolbarOption, index: number): void {
    if (this.selectStates[index]) {
      if (this.checkLength()) {
        this.allSelected = false;
      }
      this.values = this.values.filter((option) => option.value !== value.value);
    } else {
      this.values.push(value);
    }
    this.selectStates[index] = !this.selectStates[index];
    this.updateController();
  }

  updateController(): void {
    this.config.value = this.values;
    this.selectionChange.next(this.values);
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
}
