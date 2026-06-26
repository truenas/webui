import {
  ChangeDetectionStrategy, Component, input, inject, DestroyRef, signal, viewChild,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective,
  TnSidePanelActionDirective, TnSidePanelComponent,
} from '@truenas/ui-components';
import { Observable, of } from 'rxjs';
import { containerCapabilitiesPolicyLabels, containerIdmapTypeLabels, containerTimeLabels } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import { Container } from 'app/interfaces/container.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { UnsavedChangesService } from 'app/modules/unsaved-changes/unsaved-changes.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ContainerFormComponent } from 'app/pages/containers/components/container-form/container-form.component';
import { ContainersStore } from 'app/pages/containers/stores/containers.store';

@Component({
  selector: 'ix-container-general-info',
  templateUrl: './container-general-info.component.html',
  styleUrls: ['./container-general-info.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TnButtonComponent,
    TnCardComponent,
    TnCardFooterActionsDirective,
    TnSidePanelComponent,
    TnSidePanelActionDirective,
    ContainerFormComponent,
    TranslateModule,
    YesNoPipe,
    MapValuePipe,
  ],
})
export class ContainerGeneralInfoComponent {
  protected formatter = inject(IxFormatterService);
  private destroyRef = inject(DestroyRef);
  private dialogService = inject(DialogService);
  private translate = inject(TranslateService);
  private api = inject(ApiService);
  private router = inject(Router);
  private unsavedChangesService = inject(UnsavedChangesService);
  private containersStore = inject(ContainersStore);
  private authService = inject(AuthService);

  container = input.required<Container>();

  protected readonly editOpen = signal(false);
  protected readonly editForm = viewChild(ContainerFormComponent);

  protected readonly editCloseGuard = (): Observable<boolean> => {
    if (!this.editForm()?.hasUnsavedChanges()) {
      return of(true);
    }
    return this.unsavedChangesService.showConfirmDialog();
  };

  protected readonly Role = Role;
  protected readonly containerCapabilitiesPolicyLabels = containerCapabilitiesPolicyLabels;
  protected readonly containerIdmapTypeLabels = containerIdmapTypeLabels;
  protected readonly containerTimeLabels = containerTimeLabels;

  protected readonly canModify = toSignal(
    this.authService.hasRole([Role.ContainerWrite]),
    { initialValue: false },
  );

  protected editContainer(): void {
    this.editOpen.set(true);
  }

  protected onEditClosed(saved: boolean): void {
    this.editOpen.set(false);

    if (saved) {
      this.containersStore.reload();
    }
  }

  protected deleteContainer(): void {
    this.dialogService.confirmDelete({
      message: this.translate.instant('Delete {name}?', { name: this.container().name }),
      call: () => this.api.call('container.delete', [this.container().id]),
    }).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe(() => {
      this.router.navigate(['/containers']);
    });
  }
}
