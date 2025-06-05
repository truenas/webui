import { ChangeDetectionStrategy, Component, Host } from '@angular/core';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';
import { TestDirective } from 'app/modules/test-id/test.directive';

@UntilDestroy()
@Component({
  selector: 'ix-explorer-create-zvol',
  templateUrl: './create-zvol.component.html',
  styleUrls: ['./create-zvol.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [MatButton, IxIconComponent, TranslateModule, RequiresRolesDirective, TestDirective],
})
export class IxExplorerCreateZvolComponent {
  protected readonly requiredRoles = [Role.DatasetWrite];

  constructor(
    @Host() private explorer: IxExplorerComponent,
    private slideIn: SlideIn,
  ) {}

  protected get disabled(): boolean {
    const node = this.explorer.getActiveNode();
    return !node || !node.data.isMountpoint || this.explorer.isDisabled;
  }

  protected onCreateZvol(): void {
    const selected = Array.isArray(this.explorer.value) ? this.explorer.value[0] : this.explorer.value;

    this.slideIn.open(ZvolFormComponent, {
      data: { isNew: true, parentId: this.explorer.parentDatasetName(selected) },
    }).pipe(
      filter((response) => Boolean(response.response)),
      untilDestroyed(this),
    ).subscribe((response) => {
      const zvol = response.response as Dataset;
      const node = this.explorer.getActiveNode();
      if (node?.isExpanded) {
        node.collapse();
      }
      if (node) {
        this.explorer.refreshNode(node);
      }
      this.explorer.writeValue(`/dev/zvol/${zvol.id}`);
      this.explorer.onChange(this.explorer.value);
    });
  }
}
