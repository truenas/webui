import {
  Component, ViewChild, Input, AfterViewInit, ChangeDetectorRef,
} from '@angular/core';
import { MatOption } from '@angular/material/core';
import { MatSelect } from '@angular/material/select';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { IxAbstractObject } from 'app/core/classes/ix-abstract-object';
import { Option } from 'app/interfaces/option.interface';
import { ControlConfig } from 'app/pages/common/entity/entity-toolbar/models/control-config.interface';
import { Control } from 'app/pages/common/entity/entity-toolbar/models/control.interface';

@Component({
  selector: 'toolbar-multiselect',
  templateUrl: './toolbar-multiselect.component.html',
  styleUrls: ['./toolbar-multiselect.component.scss'],
})
export class ToolbarMultiSelectComponent extends IxAbstractObject implements AfterViewInit {
  @ViewChild('matSelectRef') matSelectRef: MatSelect;
  @Input() config?: ControlConfig;
  @Input() controller: Subject<Control>;
  values: Option[] = [];

  constructor(
    public translate: TranslateService,
    private changeDetectorRef: ChangeDetectorRef,
  ) {
    super();
  }

  ngAfterViewInit(): void {
    this.deselectAll();
    if (this.config.value && this.config.value.length) {
      this.config.value
        .map(() => this.config.options.findIndex((x) => x.value))
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
    const message: Control = { name: this.config.name, value: this.values };
    this.controller.next(message);
  }

  isAllSelected(): boolean {
    return this.config.options.every(
      (option: Option) => this.values.find(((value) => value.value === option.value)),
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
    const option = this.config.options[index] as Option;

    return Boolean(this.values.find((value) => value.value === option.value));
  }

  selectOption(index: number): void {
    const option = this.config.options[index] as Option;
    this.values.push(option);

    this.triggerMatOptionSelectionUpdate([this.matSelectRef.options.get(index)], true);
  }

  deselectOption(index: number): void {
    const option = this.config.options[index] as Option;
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
