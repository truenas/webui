import { AfterViewInit, ChangeDetectionStrategy, Component, computed, DestroyRef, signal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NgControl } from '@angular/forms';
import { MatButton } from '@angular/material/button';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnIconComponent } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { ExplorerNodeType } from 'app/enums/explorer-type.enum';
import { Role } from 'app/enums/role.enum';
import { helptextZvol } from 'app/helptext/storage/volumes/zvol-form';
import { Dataset } from 'app/interfaces/dataset.interface';
import { IxExplorerComponent } from 'app/modules/forms/ix-forms/components/ix-explorer/ix-explorer.component';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { TestDirective } from 'app/modules/test-id/test.directive';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';

@Component({
  selector: 'ix-explorer-create-zvol',
  templateUrl: './explorer-create-zvol.component.html',
  styleUrls: ['./explorer-create-zvol.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    TnIconComponent,
    TranslateModule,
    RequiresRolesDirective,
    TestDirective,
  ],
})
export class ExplorerCreateZvolComponent implements AfterViewInit {
  private explorer = inject(IxExplorerComponent);
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
  private ngControl = inject(NgControl);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.DatasetWrite];

  protected isButtonDisabled = computed(() => {
    const nodeData = this.explorer.lastSelectedNode()?.data;
    const isZvolParent = nodeData?.path?.startsWith('/dev/zvol') && nodeData?.type === ExplorerNodeType.Directory;
    return this.explorer.isDisabled() || !isZvolParent || !this.parent();
  });

  protected explorerValue = signal<string | string[]>('');

  ngAfterViewInit(): void {
    // TODO: Unclear why this is needed, but control in `ngControl` is empty for some reason in constructor.
    this.ngControl.control?.valueChanges?.pipe(
      takeUntilDestroyed(this.destroyRef),
    )?.subscribe((value: string | string[]) => {
      this.explorerValue.set(value);
    });
  }

  private parent = computed(() => {
    const value = this.explorerValue();
    const selected = Array.isArray(value) ? value[0] : value;
    return selected ? selected.replace(/^(\/dev\/zvol\/?)/, '') : null;
  });

  protected onCreateZvol(): void {
    const parent = this.parent();
    // `isButtonDisabled` already covers this, but `inputs` is an untyped bag: without the guard a
    // null would flow into `ZvolFormComponent.params.parentOrZvolId`, which is a required string.
    if (!parent) {
      return;
    }

    this.formPanel.open<Dataset>(ZvolFormComponent, {
      title: this.translate.instant(helptextZvol.addTitle),
      inputs: {
        params: {
          isNew: true,
          parentOrZvolId: parent,
        },
      },
    }).onSuccess((zvol) => {
      const node = this.explorer.lastSelectedNode();
      if (node) {
        this.explorer.refreshNode(node);
      }
      this.ngControl.control.setValue(`/dev/zvol/${zvol.id}`);
    }, this.destroyRef);
  }
}
