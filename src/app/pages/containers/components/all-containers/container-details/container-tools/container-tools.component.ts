import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import {
  TnCardComponent,
  TnIconComponent,
  TnListComponent,
  TnListItemComponent,
  TnTestIdDirective,
  TnTooltipDirective,
} from '@truenas/ui-components';
import { ContainerStatus } from 'app/enums/container.enum';
import { AuthService } from 'app/modules/auth/auth.service';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

@Component({
  selector: 'ix-container-tools',
  templateUrl: './container-tools.component.html',
  styleUrls: ['./container-tools.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnCardComponent,
    TnListComponent,
    TnListItemComponent,
    TnIconComponent,
    TnTooltipDirective,
    TnTestIdDirective,
    TranslateModule,
  ],
})
export class ContainerToolsComponent {
  private containersStore = inject(ContainersStore);
  private router = inject(Router);
  private authService = inject(AuthService);

  protected readonly container = this.containersStore.selectedContainer;

  // The container console connects through the same `web_shell`-gated endpoint as the
  // system shell, so a user without that privilege can't open it regardless of state.
  protected readonly hasWebShellAccess = toSignal(this.authService.hasWebShellAccess$, { initialValue: false });

  protected readonly isContainerStopped = computed(() => {
    return this.container()?.status?.state !== ContainerStatus.Running;
  });

  protected readonly canOpenShell = computed(() => this.hasWebShellAccess() && !this.isContainerStopped());

  protected readonly shellTooltip = computed(() => {
    if (!this.hasWebShellAccess()) {
      return T('Your user permissions do not allow Web Shell access.');
    }
    return this.isContainerStopped() ? T('Container is not running') : '';
  });

  protected openShell(containerId: number): void {
    this.router.navigate(['/containers', 'view', containerId, 'shell']);
  }
}
