import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { UiSearchDirective } from 'app/directives/ui-search.directive';
import { Role } from 'app/enums/role.enum';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { allInstancesHeaderElements } from 'app/pages/instances/components/all-instances/all-instances-header/all-instances-header.elements';
import {
  GlobalConfigFormComponent,
} from 'app/pages/instances/components/all-instances/all-instances-header/global-config-form/global-config-form.component';
import { InstanceFormComponent } from 'app/pages/instances/components/instance-form/instance-form.component';
import {
  ContainerConfigStore,
} from 'app/pages/instances/stores/container-config.store';
import { ContainerInstancesStore } from 'app/pages/instances/stores/container-instances.store';

@UntilDestroy()
@Component({
  selector: 'ix-all-instances-header',
  templateUrl: './all-instances-header.component.html',
  styleUrls: ['./all-instances-header.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    MatButton,
    TestDirective,
    UiSearchDirective,
    RequiresRolesDirective,
  ],
})
export class AllInstancesHeaderComponent {
  private slideIn = inject(SlideIn);
  private configStore = inject(ContainerConfigStore);
  private instanceStore = inject(ContainerInstancesStore);

  protected readonly searchableElements = allInstancesHeaderElements;
  protected readonly config = this.configStore.config;
  protected readonly requiredRoles = [Role.ContainerWrite];

  protected onCreateContainer(): void {
    this.slideIn
      .open(InstanceFormComponent)
      .pipe(untilDestroyed(this))
      .subscribe();
  }

  protected onGlobalConfiguration(): void {
    this.slideIn
      .open(GlobalConfigFormComponent, { data: this.config() })
      .pipe(untilDestroyed(this))
      .subscribe({
        next: () => {
          this.configStore.initialize();
          this.instanceStore.initialize();
        },
      });
  }
}
