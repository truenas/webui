import {
  AfterViewInit,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  Input, output,
} from '@angular/core';
import { AbstractControl } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { ChartSchemaNode } from 'app/interfaces/app.interface';
import { IxErrorsComponent } from 'app/modules/forms/ix-forms/components/ix-errors/ix-errors.component';
import { IxLabelComponent } from 'app/modules/forms/ix-forms/components/ix-label/ix-label.component';
import { RegisteredControlDirective, registeredDirectiveConfig } from 'app/modules/forms/ix-forms/directives/registered-control.directive';
import { TestDirective } from 'app/modules/test-id/test.directive';

@Component({
  selector: 'ix-list',
  templateUrl: './ix-list.component.html',
  styleUrls: ['./ix-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxLabelComponent,
    MatButton,
    IxErrorsComponent,
    TranslateModule,
    TestDirective,
    RegisteredControlDirective,
  ],
  hostDirectives: [
    { ...registeredDirectiveConfig },
  ],
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
  @Input({ required: true }) formArrayName: string;

  readonly add = output<ChartSchemaNode[]>();

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
