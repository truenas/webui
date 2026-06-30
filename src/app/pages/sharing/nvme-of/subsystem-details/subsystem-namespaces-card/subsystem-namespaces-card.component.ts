import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, inject, input, signal, viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnBannerComponent, TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective, TnDialog, TnIconButtonComponent,
  TnSidePanelActionDirective, TnSidePanelComponent,
} from '@truenas/ui-components';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfNamespace, NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { sidePanelFormCloseGuard } from 'app/modules/slide-ins/side-panel-form.directive';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import {
  NamespaceDescriptionComponent,
} from 'app/pages/sharing/nvme-of/namespaces/namespace-description/namespace-description.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import {
  NamespaceFormComponent, NamespaceFormParams,
} from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-namespaces-card/namespace-form/namespace-form.component';
import { subsystemNamespacesCardElements } from 'app/pages/sharing/nvme-of/subsystem-details/subsystem-namespaces-card/subsystem-namespaces-card.elements';
import { DeleteNamespaceDialogComponent } from './delete-namespace-dialog/delete-namespace-dialog.component';

@Component({
  selector: 'ix-subsystem-namespaces-card',
  templateUrl: './subsystem-namespaces-card.component.html',
  styleUrl: './subsystem-namespaces-card.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnCardFooterActionsDirective,
    TranslateModule,
    TnBannerComponent,
    TnIconButtonComponent,
    NamespaceDescriptionComponent,
    UiSearchDirective,
    TnButtonComponent,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    NamespaceFormComponent,
    RequiresRolesDirective,
  ],
})
export class SubsystemNamespacesCardComponent {
  private nvmeOfStore = inject(NvmeOfStore);
  private unsavedChanges = inject(UnsavedChangesService);
  private tnDialog = inject(TnDialog);
  private destroyRef = inject(DestroyRef);

  subsystem = input.required<NvmeOfSubsystemDetails>();

  protected readonly helptext = helptextNvmeOf;

  protected readonly searchableElements = subsystemNamespacesCardElements;

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  // Add-namespace form hosted in a <tn-side-panel> (the form is dual-host: it also
  // still opens via legacy SlideIn from other call sites, e.g. the add-subsystem wizard).
  protected readonly namespacePanelOpen = signal(false);
  protected readonly namespaceFormData = computed<NamespaceFormParams>(() => ({
    subsystemId: this.subsystem().id,
  }));

  protected readonly namespaceForm = viewChild(NamespaceFormComponent);
  protected readonly namespaceCloseGuard = sidePanelFormCloseGuard(this.unsavedChanges, () => this.namespaceForm());

  protected onAddNamespace(): void {
    this.namespacePanelOpen.set(true);
  }

  protected onNamespaceSaved(): void {
    this.namespacePanelOpen.set(false);
    this.nvmeOfStore.initialize();
  }

  protected onDeleteNamespace(namespace: NvmeOfNamespace): void {
    this.tnDialog.open(DeleteNamespaceDialogComponent, { data: namespace })
      .closed
      .pipe(
        filter(Boolean),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe(() => {
        this.nvmeOfStore.initialize();
      });
  }
}
