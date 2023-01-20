import {
  AfterViewInit,
  Component, EventEmitter, Input, Output,
} from '@angular/core';
import { ChartSchemaNode } from 'app/interfaces/chart-release.interface';

@Component({
  selector: 'ix-list',
  templateUrl: './ix-list.component.html',
  styleUrls: ['./ix-list.component.scss'],
})
export class IxListComponent implements AfterViewInit {
  @Input() label: string;
  @Input() tooltip: string;
  @Input() empty: boolean;
  @Input() required: boolean;
  @Input() canAdd = true;
  @Input() default: unknown[];
  @Input() itemsSchema: ChartSchemaNode[];
  @Input() isEditMode: boolean;

  @Output() add = new EventEmitter<ChartSchemaNode[]>();

  ngAfterViewInit(): void {
    if (!this.isEditMode && this.default?.length > 0) {
      this.handleListDefaults();
    }
  }

  addItem(schema?: ChartSchemaNode[]): void {
    this.add.emit(schema);
  }

  isDisabled = false;

  setDisabledState(isDisabled: boolean): void {
    this.isDisabled = isDisabled;
  }

  private handleListDefaults(): void {
    setTimeout(() => {
      this.default.forEach((defaultValue: never) => {
        this.addItem(
          this.itemsSchema.map((item: ChartSchemaNode) => {
            return {
              ...item,
              schema: {
                ...item.schema,
                default: defaultValue?.[item.variable] ?? (typeof defaultValue !== 'object' ? defaultValue : item.schema.default),
              },
            };
          }),
        );
      });
    });
  }
}
