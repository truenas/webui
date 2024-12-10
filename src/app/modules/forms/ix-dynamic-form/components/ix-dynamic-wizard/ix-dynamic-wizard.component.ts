import {
  ChangeDetectionStrategy, Component, input, output,
} from '@angular/core';
import { UntypedFormGroup } from '@angular/forms';
import { MatDivider } from '@angular/material/divider';
import { UntilDestroy } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { AddListItemEvent, DeleteListItemEvent, DynamicWizardSchema } from 'app/interfaces/dynamic-form-schema.interface';
import { IxDynamicFormItemComponent } from 'app/modules/forms/ix-dynamic-form/components/ix-dynamic-form/ix-dynamic-form-item/ix-dynamic-form-item.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';

@UntilDestroy()
@Component({
  selector: 'ix-dynamic-wizard',
  styleUrls: ['./ix-dynamic-wizard.component.scss'],
  templateUrl: './ix-dynamic-wizard.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    IxFieldsetComponent,
    MatDivider,
    IxDynamicFormItemComponent,
    TranslateModule,
  ],
})

export class IxDynamicWizardComponent {
  readonly dynamicForm = input.required<UntypedFormGroup>();
  readonly dynamicSection = input.required<DynamicWizardSchema[]>();
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
