import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, input,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatButton, MatIconButton } from '@angular/material/button';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { uniqBy } from 'lodash-es';
import { filter } from 'rxjs';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import {
  AddSubsystemNamespaceComponent,
} from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem-namespaces/add-subsystem-namespace/add-subsystem-namespace.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';
import {
  NamespaceDescriptionComponent,
} from 'app/pages/sharing/nvme-of/namespaces/namespace-description/namespace-description.component';

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
  namespacesControl = input.required<FormControl<NamespaceChanges[]>>();

  constructor(
    private slideIn: SlideIn,
    private cdr: ChangeDetectorRef,
  ) {}

  protected get namespaces(): NamespaceChanges[] {
    return this.namespacesControl()?.value || [];
  }

  protected onAddNamespace(): void {
    this.slideIn.open(AddSubsystemNamespaceComponent)
      .pipe(
        filter((response) => Boolean(response.response)),
        untilDestroyed(this),
      )
      .subscribe((response) => {
        const newNamespaces = [...this.namespaces, response.response];
        this.namespacesControl().setValue(uniqBy(newNamespaces, 'device_path'));

        this.cdr.markForCheck();
      });
  }

  protected onDeleteNamespace(indexToRemove: number): void {
    const currentNamespaces = this.namespacesControl().value.filter((_, i) => i !== indexToRemove);
    this.namespacesControl().setValue(currentNamespaces);
  }
}
