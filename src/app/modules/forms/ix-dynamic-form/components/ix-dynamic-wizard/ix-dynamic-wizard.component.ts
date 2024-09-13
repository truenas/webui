import {
  ChangeDetectionStrategy, Component, Input, output,
} from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { UntilDestroy } from '@ngneat/until-destroy';
import { AddListItemEvent, DeleteListItemEvent, DynamicWizardSchema } from 'app/interfaces/dynamic-form-schema.interface';

@UntilDestroy()
@Component({
  selector: 'ix-dynamic-wizard',
  styleUrls: ['./ix-dynamic-wizard.component.scss'],
  templateUrl: './ix-dynamic-wizard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})

export class IxDynamicWizardComponent {
  @Input() dynamicForm: UntypedFormGroup;
  @Input() dynamicSection: DynamicWizardSchema[];
  @Input() isEditMode: boolean;

  readonly addListItem = output<AddListItemEvent>();
  readonly deleteListItem = output<DeleteListItemEvent>();

  addControlNext(event: AddListItemEvent): void {
    this.addListItem.emit(event);
  }

  removeControlNext(event: DeleteListItemEvent): void {
    this.deleteListItem.emit(event);
  }
}
