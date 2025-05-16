import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { MatTabLink, MatTabNav, MatTabNavPanel } from '@angular/material/tabs';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { NvmeOfSubsystem } from 'app/interfaces/nvme-of.interface';
import { PageHeaderComponent } from 'app/modules/page-header/page-title-header/page-header.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { AddSubsystemComponent } from 'app/pages/sharing/nvme-of/add-subsystem/add-subsystem.component';
import {
  NvmeOfConfigurationComponent,
} from 'app/pages/sharing/nvme-of/nvme-of-configuration/nvme-of-configuration.component';
import { nvmeOfElements } from 'app/pages/sharing/nvme-of/nvme-of.elements';
import { NvmeOfStore } from 'app/pages/sharing/nvme-of/nvme-of.store';

@UntilDestroy()
@Component({
  selector: 'ix-nvme-of',
  templateUrl: './nvme-of.component.html',
  styleUrls: ['./nvme-of.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButton,
    PageHeaderComponent,
    RequiresRolesDirective,
    TestDirective,
    TranslateModule,
    UiSearchDirective,
    MatTabLink,
    MatTabNav,
    MatTabNavPanel,
    RouterLinkActive,
    RouterOutlet,
    RouterLink,
  ],
})
export class NvmeOfComponent {
  protected readonly searchableElements = nvmeOfElements;
  protected readonly requiredRoles = [Role.SharingNvmeTargetWrite];

  protected readonly navLinks = [
    {
      label: this.translate.instant('Subsystems'),
      path: '/sharing/nvme-of/subsystems',
    },
    {
      label: this.translate.instant('Hosts'),
      path: '/sharing/nvme-of/hosts',
    },
    {
      label: this.translate.instant('Ports'),
      path: '/sharing/nvme-of/ports',
    },
  ];

  constructor(
    private slideIn: SlideIn,
    private translate: TranslateService,
    private nvmeOfStore: NvmeOfStore,
  ) {}

  protected openGlobalConfiguration(): void {
    this.slideIn.open(NvmeOfConfigurationComponent);
  }

  protected addSubsystem(): void {
    this.slideIn.open(AddSubsystemComponent).pipe(
      filter(({ response }: { response: false | NvmeOfSubsystem }) => !!response),
      untilDestroyed(this),
    ).subscribe(() => this.nvmeOfStore.initialize());
  }
}
