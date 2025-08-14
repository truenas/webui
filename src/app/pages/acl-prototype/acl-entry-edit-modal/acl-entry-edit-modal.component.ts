import { ChangeDetectionStrategy, Component, inject, OnDestroy, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogTitle } from '@angular/material/dialog';
import { TranslateModule } from '@ngx-translate/core';
import { of, Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { IxCheckboxComponent } from 'app/modules/forms/ix-forms/components/ix-checkbox/ix-checkbox.component';
import { IxFieldsetComponent } from 'app/modules/forms/ix-forms/components/ix-fieldset/ix-fieldset.component';
import { IxSelectComponent } from 'app/modules/forms/ix-forms/components/ix-select/ix-select.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { AclEntry } from 'app/pages/acl-prototype/acl-prototype.component';

export interface AclEntryEditData {
  entry: AclEntry;
  isDefault: boolean;
}

@Component({
  selector: 'ix-acl-entry-edit-modal',
  templateUrl: './acl-entry-edit-modal.component.html',
  styleUrls: ['./acl-entry-edit-modal.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    ReactiveFormsModule,
    TranslateModule,
    MatButton,
    MatDialogTitle,
    IxFieldsetComponent,
    IxSelectComponent,
    IxCheckboxComponent,
    IxIconComponent,
  ],
})
export class AclEntryEditModalComponent implements OnDestroy {
  private dialogRef = inject(MatDialogRef<AclEntryEditModalComponent>);
  private data = inject<AclEntryEditData>(MAT_DIALOG_DATA);
  private fb = inject(FormBuilder);
  private destroy$ = new Subject<void>();

  readonly form = this.fb.group({
    type: [this.data.entry.type, Validators.required],
    name: [this.data.entry.name],
    permissions: this.fb.group({
      read: [this.data.entry.permissions.read],
      write: [this.data.entry.permissions.write],
      execute: [this.data.entry.permissions.execute],
    }),
    isDefault: [this.data.isDefault],
  });

  readonly typeOptions = of([
    { label: 'User', value: 'USER' },
    { label: 'Group', value: 'GROUP' },
    { label: 'Owner', value: 'USER_OBJ' },
    { label: 'Owning Group', value: 'GROUP_OBJ' },
    { label: 'Mask', value: 'MASK' },
    { label: 'Other', value: 'OTHER' },
  ]);

  // Mock user/group options for prototype
  readonly userOptions = of([
    { label: 'alice', value: 'alice' },
    { label: 'bob', value: 'bob' },
    { label: 'charlie', value: 'charlie' },
    { label: 'admin', value: 'admin' },
  ]);

  readonly groupOptions = of([
    { label: 'staff', value: 'staff' },
    { label: 'developers', value: 'developers' },
    { label: 'admins', value: 'admins' },
    { label: 'users', value: 'users' },
  ]);

  readonly selectedType = signal<string>(this.data.entry.type);

  constructor() {
    // Watch for type changes to show/hide name field
    this.form.controls.type.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe((type) => {
        this.selectedType.set(type || '');
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  needsNameField(): boolean {
    const type = this.selectedType();
    return type === 'USER' || type === 'GROUP';
  }

  isRequiredEntry(): boolean {
    const type = this.selectedType();
    return type === 'USER_OBJ' || type === 'GROUP_OBJ' || type === 'OTHER';
  }

  onSave(): void {
    if (this.form.valid) {
      const formValue = this.form.value;
      const updatedEntry: AclEntry = {
        ...this.data.entry,
        type: formValue.type as AclEntry['type'],
        name: formValue.name || '',
        permissions: {
          read: formValue.permissions?.read || false,
          write: formValue.permissions?.write || false,
          execute: formValue.permissions?.execute || false,
        },
        isDefault: formValue.isDefault || false,
      };
      this.dialogRef.close(updatedEntry);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
