import {
  Component, EventEmitter, Input, OnInit, Output,
} from '@angular/core';
import { ToolbarMenuOption } from 'app/modules/entity/entity-toolbar/components/toolbar-multimenu/toolbar-menu-option.interface';

@Component({
  selector: 'ix-toolbar-multimenu',
  styleUrls: ['toolbar-multimenu.component.scss'],
  templateUrl: 'toolbar-multimenu.component.html',
})
export class ToolbarMultimenuComponent implements OnInit {
  @Input() label: string;
  @Input() options: ToolbarMenuOption[];
  @Input() selected: ToolbarMenuOption[];
  @Output() selectionChange = new EventEmitter<ToolbarMenuOption[]>();

  allSelected = false;
  values: ToolbarMenuOption[] = [];
  selectStates: boolean [] = [];

  ngOnInit(): void {
    this.selectStates.length = this.options.length;
    this.selectStates.fill(false);
    if (this.selected) {
      for (const value of this.selected) {
        if (value) {
          this.values.push(value);
          for (let i = 0; i < this.selectStates.length; i++) {
            if (this.options[i].value === value.value) {
              this.selectStates[i] = true;
              break;
            }
          }
        }
      }
    } else {
      this.values.push(this.options[0]);
      this.selectStates[0] = true;
    }

    this.updateController();
  }

  onClick(value: ToolbarMenuOption, index: number): void {
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
    this.selected = this.values;
    this.selectionChange.next(this.values);
  }

  checkLength(): boolean {
    return this.values.length === this.selectStates.length;
  }

  checkAll(): void {
    this.allSelected = this.checkLength();
    if (!this.allSelected) {
      this.selectStates.fill(true);
      this.values = Object.assign([], this.options);
    } else {
      this.selectStates.fill(false);
      this.values = [];
    }
    this.updateController();
  }
}
