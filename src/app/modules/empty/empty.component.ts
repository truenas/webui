import {
  ChangeDetectionStrategy, Component, computed, input, inject, HostBinding,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
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
  private translate = inject(TranslateService);

  readonly conf = input<EmptyConfig | null>({
    title: this.translate.instant('No records'),
    message: this.translate.instant('There are no records to show.'),
    large: true,
    type: EmptyType.NoPageData,
  });

  readonly requiredRoles = input<Role[]>([]);

  @HostBinding('class.is-hidden')
  get isHidden(): boolean {
    return !this.conf();
  }

  doAction(): void {
    const action = this.conf()?.button?.action;
    if (action) {
      action();
    }
  }

  protected isLoading = computed(() => {
    return this.conf()?.type === EmptyType.Loading;
  });

  getIcon(): string | undefined {
    const conf = this.conf();
    if (!conf) {
      return undefined;
    }

    let icon: string = tnIconMarker('harbor-logo', 'custom');
    const confIcon = conf.icon;
    if (confIcon) {
      icon = confIcon;
    } else {
      const type = conf.type;
      if (!type) {
        return undefined;
      }

      switch (type) {
        case EmptyType.Loading:
          icon = tnIconMarker('harbor-logo', 'custom');
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
