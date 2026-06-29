import { ChangeDetectionStrategy, ChangeDetectorRef, Component, DestroyRef, inject, input } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnIconButtonComponent } from '@truenas/ui-components';
import { uniqBy } from 'lodash-es';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import {
  AddSubsystemNamespaceComponent,
} from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem-namespaces/add-subsystem-namespace/add-subsystem-namespace.component';
import { NamespaceChanges } from 'app/pages/sharing/nvme-of/namespaces/base-namespace-form/namespace-changes.interface';
import {
  NamespaceDescriptionComponent,
} from 'app/pages/sharing/nvme-of/namespaces/namespace-description/namespace-description.component';

@Component({
  selector: 'ix-add-subsystem-namespaces',
  templateUrl: './add-subsystem-namespaces.component.html',
  styleUrl: './add-subsystem-namespaces.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    ReactiveFormsModule,
    TnButtonComponent,
    TnIconButtonComponent,
    NamespaceDescriptionComponent,
  ],
})
export class AddSubsystemNamespacesComponent {
  private slideIn = inject(SlideIn);
  private cdr = inject(ChangeDetectorRef);
  private destroyRef = inject(DestroyRef);

  namespacesControl = input.required<FormControl<NamespaceChanges[]>>();

  protected get namespaces(): NamespaceChanges[] {
    return this.namespacesControl()?.value || [];
  }

  protected onAddNamespace(): void {
    this.slideIn.open(AddSubsystemNamespaceComponent)
      .onSuccess((response) => {
        const newNamespaces = [...this.namespaces, response];
        this.namespacesControl().setValue(uniqBy(newNamespaces, 'device_path'));

        this.cdr.markForCheck();
      }, this.destroyRef);
  }

  protected onDeleteNamespace(indexToRemove: number): void {
    const currentNamespaces = this.namespacesControl().value.filter((_, i) => i !== indexToRemove);
    this.namespacesControl().setValue(currentNamespaces);
  }
}
