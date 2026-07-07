import { ChangeDetectionStrategy, Component, DestroyRef, inject, input } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnDialog, TnIconComponent, TnTooltipDirective } from '@truenas/ui-components';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfNamespace, NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
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
    MatCard,
    MatCardHeader,
    MatCardTitle,
    TranslateModule,
    TnIconComponent,
    MatCardContent,
    MatIconButton,
    NamespaceDescriptionComponent,
    TnTooltipDirective,
    TestDirective,
    UiSearchDirective,
    MatButton,
    RequiresRolesDirective,
  ],
})
export class SubsystemNamespacesCardComponent {
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
  private nvmeOfStore = inject(NvmeOfStore);
  private tnDialog = inject(TnDialog);
  private destroyRef = inject(DestroyRef);

  subsystem = input.required<NvmeOfSubsystemDetails>();

  protected readonly helptext = helptextNvmeOf;

  protected readonly searchableElements = subsystemNamespacesCardElements;

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  protected onAddNamespace(): void {
    // Opened footerless — the base form owns Save.
    this.formPanel.open(NamespaceFormComponent, {
      title: this.translate.instant('Add Namespace'),
      footerless: true,
      inputs: { namespaceData: { subsystemId: this.subsystem().id } },
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
