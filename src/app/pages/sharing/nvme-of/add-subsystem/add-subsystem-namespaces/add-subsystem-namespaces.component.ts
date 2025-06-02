import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { uniqBy } from 'lodash-es';
import { filter } from 'rxjs';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  NamespaceDescriptionComponent,
} from 'app/pages/sharing/nvme-of/namespaces/namespace-description/namespace-description.component';
import {
  NamespaceDialogComponent,
} from 'app/pages/sharing/nvme-of/namespaces/namespace-dialog/namespace-dialog.component';
import { NewNamespace } from 'app/pages/sharing/nvme-of/namespaces/namespace-dialog/new-namespace.interface';

@UntilDestroy()
@Component({
  selector: 'ix-add-subsystem-namespaces',
  templateUrl: './add-subsystem-namespaces.component.html',
  styleUrl: './add-subsystem-namespaces.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    MatButton,
    MatIconButton,
    IxIconComponent,
    MatTooltip,
    TestDirective,
    NamespaceDescriptionComponent,
  ],
})
export class AddSubsystemNamespacesComponent {
  namespacesControl = input.required<FormControl<NewNamespace[]>>();

  constructor(
    private matDialog: MatDialog,
    private cdr: ChangeDetectorRef,
  ) {}

  protected get namespaces(): NewNamespace[] {
    return this.namespacesControl()?.value || [];
  }

  protected onAddNamespace(): void {
    this.matDialog.open(NamespaceDialogComponent, { minWidth: '400px' }).afterClosed()
      .pipe(filter(Boolean), untilDestroyed(this))
      .subscribe((newNamespace: NewNamespace) => {
        const newNamespaces = [...this.namespaces, newNamespace];
        this.namespacesControl().setValue(uniqBy(newNamespaces, 'device_path'));

        this.cdr.markForCheck();
      });
  }

  protected onDeleteNamespace(indexToRemove: number): void {
    const currentNamespaces = this.namespacesControl().value.filter((_, i) => i !== indexToRemove);
    this.namespacesControl().setValue(currentNamespaces);
  }
}
