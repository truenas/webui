import {
  ChangeDetectionStrategy, Component, EventEmitter, inject, input, Output, signal,
} from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { TranslateModule } from '@ngx-translate/core';
import { finalize } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { containersHelptext } from 'app/helptext/containers/containers';
import { directIdMapping } from 'app/interfaces/user.interface';
import { GroupComboboxProvider } from 'app/modules/forms/ix-forms/classes/group-combobox-provider';
import { UserComboboxProvider } from 'app/modules/forms/ix-forms/classes/user-combobox-provider';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxComboboxComponent } from 'app/modules/forms/ix-forms/components/ix-combobox/ix-combobox.component';
import { IxInputComponent } from 'app/modules/forms/ix-forms/components/ix-input/ix-input.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { UserService } from 'app/services/user.service';
import { MappingType } from '../mapping.types';

@Component({
  selector: 'ix-new-mapping-form',
  templateUrl: './new-mapping-form.component.html',
  styleUrls: ['./new-mapping-form.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatButton,
    IxComboboxComponent,
    IxCheckboxComponent,
    IxInputComponent,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class NewMappingFormComponent {
  private fb = inject(FormBuilder);
  private api = inject(ApiService);
  private errorHandler = inject(ErrorHandlerService);
  private userService = inject(UserService);

  mappingType = input.required<MappingType>();

  @Output() mappingAdded = new EventEmitter<void>();

  protected readonly helptext = containersHelptext;
  protected readonly MappingType = MappingType;
  protected readonly requiredRoles = [Role.AccountWrite];
  protected isSubmitting = signal(false);

  protected readonly userProvider = new UserComboboxProvider(this.userService, { valueField: 'id' });
  protected readonly groupProvider = new GroupComboboxProvider(this.userService, { valueField: 'id' });

  protected form = this.fb.group({
    hostUidOrGid: [null as number | null, Validators.required],
    mapDirectly: [true],
    instanceUidOrGid: [null as number | null],
  });

  constructor() {
    this.form.controls.mapDirectly.valueChanges.subscribe((mapDirectly) => {
      const control = this.form.controls.instanceUidOrGid;
      if (mapDirectly) {
        control.clearValidators();
        control.setValue(null);
      } else {
        control.setValidators([Validators.required, Validators.min(0)]);
      }
      control.updateValueAndValidity();
    });
  }

  protected onSubmit(): void {
    if (this.form.invalid || this.isSubmitting()) {
      return;
    }

    const { hostUidOrGid, mapDirectly, instanceUidOrGid } = this.form.value;
    const isUser = this.mappingType() === MappingType.Users;
    const method = isUser ? 'user.update' : 'group.update';
    const idmapValue = mapDirectly ? directIdMapping : instanceUidOrGid;

    this.isSubmitting.set(true);

    this.api.call(method, [hostUidOrGid, { userns_idmap: idmapValue }] as never)
      .pipe(
        this.errorHandler.withErrorHandler(),
        finalize(() => this.isSubmitting.set(false)),
      )
      .subscribe(() => {
        this.form.reset({ mapDirectly: true });
        this.mappingAdded.emit();
      });
  }
}
