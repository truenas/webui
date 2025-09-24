import { ChangeDetectionStrategy, Component, input, inject } from '@angular/core';
import { MatButton, MatIconButton } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltip } from '@angular/material/tooltip';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { helptextNvmeOf } from 'app/helptext/sharing/nvme-of/nvme-of';
import { NvmeOfNamespace, NvmeOfSubsystemDetails } from 'app/interfaces/nvme-of.interface';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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

@UntilDestroy()
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
    IxIconComponent,
    MatCardContent,
    MatIconButton,
    NamespaceDescriptionComponent,
    MatTooltip,
    TestDirective,
    UiSearchDirective,
    MatButton,
    RequiresRolesDirective,
  ],
})
export class SubsystemNamespacesCardComponent {
  private slideIn = inject(SlideIn);
  private nvmeOfStore = inject(NvmeOfStore);
  private matDialog = inject(MatDialog);

  subsystem = input.required<NvmeOfSubsystemDetails>();

  protected readonly helptext = helptextNvmeOf;

  protected readonly searchableElements = subsystemNamespacesCardElements;

  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  protected onAddNamespace(): void {
    this.slideIn.open(NamespaceFormComponent, {
      data: { subsystemId: this.subsystem().id },
    })
      .pipe(
        filter((response) => Boolean(response.response)),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.nvmeOfStore.initialize();
      });
  }

  protected onDeleteNamespace(namespace: NvmeOfNamespace): void {
    this.matDialog.open(DeleteNamespaceDialogComponent, { data: namespace })
      .afterClosed()
      .pipe(
        filter(Boolean),
        untilDestroyed(this),
      )
      .subscribe(() => {
        this.nvmeOfStore.initialize();
      });
  }
}
