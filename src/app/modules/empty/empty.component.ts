import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { TnIconComponent, tnIconMarker } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { assertUnreachable } from 'app/helpers/assert-unreachable.utils';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { TestDirective } from 'app/modules/test-id/test.directive';

// TODO: Similar to ix-empty-row
@Component({
  selector: 'ix-empty',
  templateUrl: './empty.component.html',
  styleUrls: ['./empty.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatButtonModule,
    TranslateModule,
    MatProgressSpinnerModule,
    TnIconComponent,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class EmptyComponent {
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
    let icon: string = tnIconMarker('truenas-logo', 'custom');
    const confIcon = this.conf().icon;
    if (confIcon) {
      icon = confIcon;
    } else {
      const type = this.conf().type;
      if (!type) {
        return undefined;
      }

      switch (type) {
        case EmptyType.Loading:
          icon = tnIconMarker('truenas-logo', 'custom');
          break;
        case EmptyType.FirstUse:
          icon = tnIconMarker('rocket', 'mdi');
          break;
        case EmptyType.NoPageData:
          icon = tnIconMarker('format-list-text', 'mdi');
          break;
        case EmptyType.Errors:
          icon = tnIconMarker('alert-octagon', 'mdi');
          break;
        case EmptyType.NoSearchResults:
          icon = tnIconMarker('magnify-scan', 'mdi');
          break;
        case EmptyType.None:
          icon = tnIconMarker('', 'mdi');
          break;
        default:
          assertUnreachable(type);
      }
    }
    return icon;
  }
}
