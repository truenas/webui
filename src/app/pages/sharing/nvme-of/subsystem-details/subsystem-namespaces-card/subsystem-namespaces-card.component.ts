import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardHeaderDirective, TnDialog, TnIconButtonComponent, TnIconComponent,
} from '@truenas/ui-components';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfNamespace, NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import {
  NamespaceDescriptionComponent,
} from 'app/pages/sharing/nvme-of/namespaces/namespace-description/namespace-description.component';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/services/nvme-of.store';
import {
  NamespaceFormComponent,
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
    TnCardHeaderDirective,
    TranslateModule,
    TnIconComponent,
    TnIconButtonComponent,
    NamespaceDescriptionComponent,
    UiSearchDirective,
    TnButtonComponent,
    RequiresRolesDirective,
  ],
})
export class SubsystemNamespacesCardComponent {
  private slideIn = inject(SlideIn);
  private nvmeOfStore = inject(NvmeOfStore);
  private tnDialog = inject(TnDialog);
  private destroyRef = inject(DestroyRef);

  subsystem = input.required<NvmeOfSubsystemDetails>();

  protected readonly helptext = helptextNvmeOf;

  protected readonly searchableElements = subsystemNamespacesCardElements;

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  protected onAddNamespace(): void {
    this.slideIn.open(NamespaceFormComponent, {
      data: { subsystemId: this.subsystem().id },
    }).onSuccess(() => this.nvmeOfStore.initialize(), this.destroyRef);
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
