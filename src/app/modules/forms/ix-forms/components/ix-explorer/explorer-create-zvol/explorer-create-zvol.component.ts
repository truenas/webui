import {
  AfterViewInit, ChangeDetectionStrategy, Component, computed, Host, signal,
} from '@angular/core';
import { NgControl } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { TranslateModule } from '@ngx-translate/core';
import { filter } from 'rxjs';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { Role } from 'app/enums/role.enum';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { IxIconComponent } from 'app/modules/ix-icon/ix-icon.component';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';

@UntilDestroy()
@Component({
  selector: 'ix-explorer-create-zvol',
  templateUrl: './explorer-create-zvol.component.html',
  styleUrls: ['./explorer-create-zvol.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    IxIconComponent,
    TranslateModule,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class ExplorerCreateZvolComponent implements AfterViewInit {
  protected readonly requiredRoles = [Role.DatasetWrite];

  protected isButtonDisabled = computed(() => {
    const nodeData = this.explorer.lastSelectedNode()?.data;
    const isZvolParent = nodeData?.path?.startsWith('/dev/zvol') && nodeData?.type === ExplorerNodeType.Directory;
    return this.explorer.isDisabled() || !isZvolParent || !this.parent();
  });

  protected explorerValue = signal<string | string[]>('');

  constructor(
    @Host() private explorer: IxExplorerComponent,
    private slideIn: SlideIn,
    private ngControl: NgControl,
  ) {}

  ngAfterViewInit(): void {
    // TODO: Unclear why this is needed, but control in `ngControl` is empty for some reason in constructor.
    this.ngControl.control?.valueChanges?.pipe(untilDestroyed(this))?.subscribe((value: string | string[]) => {
      this.explorerValue.set(value);
    });
  }

  private parent = computed(() => {
    const value = this.explorerValue();
    const selected = Array.isArray(value) ? value[0] : value;
    return selected ? selected.replace(/^(\/dev\/zvol\/?)/, '') : null;
  });

  protected onCreateZvol(): void {
    this.slideIn.open(ZvolFormComponent, {
      data: {
        isNew: true,
        parentId: this.parent(),
      },
    }).pipe(
      filter((response) => Boolean(response.response)),
      untilDestroyed(this),
    ).subscribe((response) => {
      const zvol = response.response;
      const node = this.explorer.lastSelectedNode();
      if (node) {
        this.explorer.refreshNode(node);
      }
      this.ngControl.control.setValue(`/dev/zvol/${zvol.id}`);
    });
  }
}
