import {
  ChangeDetectionStrategy, Component, computed, inject, input,
} from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { TnButtonComponent, TnIconComponent, TnSpinnerComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { EmptyService } from 'app/modules/empty/empty.service';

// TODO: Similar to ix-empty-row
@Component({
  selector: 'ix-empty',
  templateUrl: './empty.component.html',
  styleUrls: ['./empty.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TranslateModule,
    TnButtonComponent,
    TnIconComponent,
    TnSpinnerComponent,
    RequiresRolesDirective,
  ],
})
export class EmptyComponent {
  private emptyService = inject(EmptyService);

  readonly conf = input.required<EmptyConfig>();
  readonly requiredRoles = input<Role[]>([]);

  doAction(): void {
    const action = this.conf().button?.action;
    if (action) {
      action();
    }
  }

  protected isLoading = computed(() => {
    return this.conf().type === EmptyType.Loading;
  });

  getIcon(): string | undefined {
    const confIcon = this.conf().icon;
    if (confIcon) {
      return confIcon;
    }

    const type = this.conf().type;
    if (!type) {
      return undefined;
    }

    return this.emptyService.iconForType(type);
  }
}
