import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnFormSectionComponent } from '@truenas/ui-components';
import { AddListItemEvent, DeleteListItemEvent, DynamicFormSchema } from 'app/interfaces/dynamic-form-schema.interface';
import { IxDynamicFormItemComponent } from './ix-dynamic-form-item/ix-dynamic-form-item.component';

@Component({
  selector: 'ix-dynamic-form',
  styleUrls: ['./ix-dynamic-form.component.scss'],
  templateUrl: './ix-dynamic-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnFormSectionComponent,
    IxDynamicFormItemComponent,
    TranslateModule,
  ],
})

export class IxDynamicFormComponent {
  readonly dynamicForm = input.required<UntypedFormGroup>();
  readonly dynamicSection = input.required<DynamicFormSchema[]>();
  readonly isEditMode = input<boolean>();

  readonly addListItem = output<AddListItemEvent>();
  readonly deleteListItem = output<DeleteListItemEvent>();

  addControlNext(event: AddListItemEvent): void {
    this.addListItem.emit(event);
  }

  removeControlNext(event: DeleteListItemEvent): void {
    this.deleteListItem.emit(event);
  }
}
