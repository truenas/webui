import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { MatAnchor } from '@angular/material/button';
import {
  MatCard, MatCardContent, MatCardHeader, MatCardTitle,
} from '@angular/material/card';
import { MatTooltip } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { marker as T } from '@biesbjerg/ngx-translate-extract-marker';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { ContainerStatus } from 'app/enums/container.enum';
import { helptextGlobal } from 'app/helptext/global-helptext';
import { AuthService } from 'app/modules/auth/auth.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

@Component({
  selector: 'ix-container-tools',
  templateUrl: './container-tools.component.html',
  styleUrls: ['./container-tools.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatCardTitle,
    MatCardHeader,
    MatCard,
    MatCardContent,
    TranslateModule,
    MatAnchor,
    TestDirective,
    TnIconComponent,
    MatTooltip,
    RouterLink,
  ],
})
export class ContainerToolsComponent {
  private containersStore = inject(ContainersStore);
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
      return helptextGlobal.webShellAccessDenied;
    }
    return this.isContainerStopped() ? T('Container is not running') : '';
  });
}
