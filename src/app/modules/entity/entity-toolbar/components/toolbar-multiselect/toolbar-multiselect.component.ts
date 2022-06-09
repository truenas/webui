import {
  Component, ViewChild, Input, AfterViewInit, ChangeDetectorRef, Output, EventEmitter,
} from '@angular/core';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { getUniqueId } from 'app/helpers/get-unique-id.helper';
import { Option } from 'app/interfaces/option.interface';
import { ControlConfig, ToolbarOption } from 'app/modules/entity/entity-toolbar/models/control-config.interface';

@Component({
  selector: 'ix-toolbar-multiselect',
  templateUrl: './toolbar-multiselect.component.html',
  styleUrls: ['./toolbar-multiselect.component.scss'],
})
export class ToolbarMultiSelectComponent implements AfterViewInit {
  @ViewChild('matSelectRef') matSelectRef: MatSelect;
  @Input() config?: ControlConfig;
  @Output() selectionChange = new EventEmitter<ToolbarOption[]>();

  values: Option[] = [];
  id = getUniqueId();

  constructor(
    private changeDetectorRef: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    this.deselectAll();
    if (this.config.value?.length) {
      this.config.value
        .map((option: Option) => this.config.options.findIndex((x) => x.value === option.value))
        .filter((index: number) => index !== -1)
        .forEach((index: number) => this.selectOption(index));
    } else {
      this.selectOption(0);
    }
    this.updateController();
  }

  onClick(index: number): void {
    if (this.isOptionSelected(index)) {
      this.deselectOption(index);
    } else {
      this.selectOption(index);
    }
    this.matSelectRef.close();
    this.updateController();
  }

  updateController(): void {
    this.config.value = this.values;
    this.selectionChange.next(this.values);
  }

  isAllSelected(): boolean {
    return this.config.options.every(
      (option) => this.values.find(((value) => value.value === option.value)),
    );
  }

  toggleAll(): void {
    if (this.isAllSelected()) {
      this.deselectAll();
    } else {
      this.selectAll();
    }
    this.updateController();
  }

  isOptionSelected(index: number): boolean {
    const option = this.config.options[index];

    return Boolean(this.values.find((value) => value.value === option.value));
  }

  selectOption(index: number): void {
    const option = this.config.options[index];
    this.values.push(option);

    this.triggerMatOptionSelectionUpdate([this.matSelectRef.options.get(index)], true);
  }

  deselectOption(index: number): void {
    const option = this.config.options[index];
    this.values.splice(this.values.indexOf(option), 1);

    this.triggerMatOptionSelectionUpdate([this.matSelectRef.options.get(index)], false);
  }

  selectAll(): void {
    this.values = this.config.options.slice();

    this.triggerMatOptionSelectionUpdate(this.matSelectRef.options, true);
  }

  deselectAll(): void {
    this.values = [];

    this.triggerMatOptionSelectionUpdate(this.matSelectRef.options, false);
  }

  triggerMatOptionSelectionUpdate(options: Iterable<MatOption>, isSelected: boolean): void {
    for (const option of options) {
      if (isSelected) {
        option.select();
      } else {
        option.deselect();
      }
    }
    this.changeDetectorRef.detectChanges();
  }
}
