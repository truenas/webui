import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  Output,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { ChartSchemaNode } from 'app/interfaces/app.interface';

@Component({
  selector: 'ix-list',
  templateUrl: './ix-list.component.html',
  styleUrls: ['./ix-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IxListComponent implements AfterViewInit {
  @Input() formArray: AbstractControl;
  @Input() label: string;
  @Input() tooltip: string;
  @Input() empty: boolean;
  @Input() required: boolean;
  @Input() canAdd = true;
  @Input() default: unknown[];
  // TODO: Does not belong to the scope of this component.
  @Input() itemsSchema: ChartSchemaNode[];
  @Input() isEditMode: boolean;

  @Output() add = new EventEmitter<ChartSchemaNode[]>();

  isDisabled = false;

  constructor(
    private cdr: ChangeDetectorRef,
  ) {}

  ngAfterViewInit(): void {
    if (!this.isEditMode && this.default?.length > 0) {
      this.handleListDefaults();
    }
  }

  addItem(schema?: ChartSchemaNode[]): void {
    this.add.emit(schema);
  }

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

      this.cdr.markForCheck();
    });
  }
}
