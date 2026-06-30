import {
  ChangeDetectionStrategy, ChangeDetectorRef, Component, inject, input, signal, viewChild,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnIconButtonComponent, TnSidePanelActionDirective, TnSidePanelComponent,
} from '@truenas/ui-components';
import { uniqBy } from 'lodash-es';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { sidePanelFormCloseGuard } from 'app/modules/slide-ins/side-panel-form.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
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
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    AddSubsystemNamespaceComponent,
    NamespaceDescriptionComponent,
    RequiresRolesDirective,
  ],
})
export class AddSubsystemNamespacesComponent {
  private cdr = inject(ChangeDetectorRef);
  private unsavedChanges = inject(UnsavedChangesService);

  namespacesControl = input.required<FormControl<NamespaceChanges[]>>();

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  // Add-namespace form hosted in a <tn-side-panel> (the form is dual-host: it also
  // still opens via legacy SlideIn from other call sites).
  protected readonly namespacePanelOpen = signal(false);
  protected readonly namespaceForm = viewChild(AddSubsystemNamespaceComponent);
  protected readonly namespaceCloseGuard = sidePanelFormCloseGuard(this.unsavedChanges, () => this.namespaceForm());

  protected get namespaces(): NamespaceChanges[] {
    return this.namespacesControl()?.value || [];
  }

  protected onAddNamespace(): void {
    this.namespacePanelOpen.set(true);
  }

  protected onNamespaceSaved(namespace: NamespaceChanges): void {
    this.namespacePanelOpen.set(false);
    const newNamespaces = [...this.namespaces, namespace];
    this.namespacesControl().setValue(uniqBy(newNamespaces, 'device_path'));
    this.cdr.markForCheck();
  }

  protected onDeleteNamespace(indexToRemove: number): void {
    const currentNamespaces = this.namespacesControl().value.filter((_, i) => i !== indexToRemove);
    this.namespacesControl().setValue(currentNamespaces);
  }
}
