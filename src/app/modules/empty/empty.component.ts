import {
  ChangeDetectionStrategy, Component, computed, input,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule } from '@ngx-translate/core';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { EmptyType } from 'app/enums/empty-type.enum';
import { Role } from 'app/enums/role.enum';
import { assertUnreachable } from 'app/helpers/assert-unreachable.utils';
import { EmptyConfig } from 'app/interfaces/empty-config.interface';
import { iconMarker, MarkedIcon } from 'app/modules/ix-icon/icon-marker.util';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

// TODO: Similar to ix-empty-row
@Component({
  selector: 'ix-empty',
  templateUrl: './empty.component.html',
  styleUrls: ['./empty.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButtonModule,
    TranslateModule,
    MatProgressSpinnerModule,
    IxIconComponent,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class EmptyComponent {
  readonly conf = input.required<EmptyConfig>();
  readonly requiredRoles = input<Role[]>();

  doAction(): void {
    if (this.conf().button.action) {
      this.conf().button.action();
    }
  }

  protected isLoading = computed(() => {
    return this.conf().type === EmptyType.Loading;
  });

  getIcon(): MarkedIcon {
    let icon = iconMarker('ix-truenas-logo');
    if (this.conf().icon) {
      icon = this.conf().icon;
    } else {
      const type = this.conf().type;
      switch (type) {
        case EmptyType.Loading:
          icon = iconMarker('ix-truenas-logo');
          break;
        case EmptyType.FirstUse:
          icon = iconMarker('mdi-rocket');
          break;
        case EmptyType.NoPageData:
          icon = iconMarker('mdi-format-list-text');
          break;
        case EmptyType.Errors:
          icon = iconMarker('mdi-alert-octagon');
          break;
        case EmptyType.NoSearchResults:
          icon = iconMarker('mdi-magnify-scan');
          break;
        default:
          assertUnreachable(type);
      }
    }
    return icon;
  }
}
