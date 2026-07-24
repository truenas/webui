import { ChangeDetectionStrategy, Component, forwardRef, inject } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { TranslateService } from '@ngx-translate/core';
import { map, Observable } from 'rxjs';
import { Role } from 'app/enums/role.enum';
import { zvolPath } from 'app/helpers/storage.helper';
import { AuthService } from 'app/modules/auth/auth.service';
import { ExplorerCreateAction } from 'app/modules/forms/ix-forms/components/ix-explorer/explorer-create-action';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
import { ZvolFormComponent } from 'app/pages/datasets/components/zvol-form/zvol-form.component';

/**
 * Renderless component: projected into `ix-explorer`, where it surfaces as a
 * "Create Zvol" button in the file-picker popup footer.
 */
@Component({
  selector: 'ix-explorer-create-zvol',
  template: '',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  providers: [
    { provide: ExplorerCreateAction, useExisting: forwardRef(() => ExplorerCreateZvolComponent) },
  ],
})
export class ExplorerCreateZvolComponent implements ExplorerCreateAction {
  private slideIn = inject(SlideIn);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);

  readonly id = 'create-zvol';
  readonly label = this.translate.instant('Create Zvol');

  readonly canCreate = toSignal(this.authService.hasRole([Role.DatasetWrite]), { initialValue: false });

  canCreateAt(parentPath: string): boolean {
    return !!this.toParentId(parentPath);
  }

  create(parentPath: string): Observable<string | null> {
    return this.slideIn.open(ZvolFormComponent, {
      data: {
        isNew: true,
        parentOrZvolId: this.toParentId(parentPath),
      },
    }).pipe(
      map(({ response }) => (response ? `${zvolPath}/${response.id}` : null)),
    );
  }

  /** Zvols can only be created under a dataset inside /dev/zvol, not at its top. */
  private toParentId(parentPath: string): string | null {
    if (!parentPath.startsWith(`${zvolPath}/`)) {
      return null;
    }
    return parentPath.slice(zvolPath.length + 1) || null;
  }
}
