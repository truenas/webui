import {
  ChangeDetectionStrategy, Component, input, inject, DestroyRef,
} from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnCardComponent, TnCardFooterActionsDirective } from '@truenas/ui-components';
import { containerCapabilitiesPolicyLabels, containerIdmapTypeLabels, containerTimeLabels } from 'app/enums/container.enum';
import { Role } from 'app/enums/role.enum';
import { Container } from 'app/interfaces/container.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { DialogService } from 'app/modules/dialog/dialog.service';
import { IxFormatterService } from 'app/modules/forms/ix-forms/services/ix-formatter.service';
import { MapValuePipe } from 'app/modules/pipes/map-value/map-value.pipe';
import { YesNoPipe } from 'app/modules/pipes/yes-no/yes-no.pipe';
import { SlideIn } from 'app/modules/slide-ins/slide-in';
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
  private slideIn = inject(SlideIn);
  private containersStore = inject(ContainersStore);
  private authService = inject(AuthService);

  container = input.required<Container>();

  protected readonly Role = Role;
  protected readonly containerCapabilitiesPolicyLabels = containerCapabilitiesPolicyLabels;
  protected readonly containerIdmapTypeLabels = containerIdmapTypeLabels;
  protected readonly containerTimeLabels = containerTimeLabels;

  protected readonly canModify = toSignal(
    this.authService.hasRole([Role.ContainerWrite]),
    { initialValue: false },
  );

  protected editContainer(): void {
    this.slideIn
      .open(ContainerFormComponent, { data: this.container() })
      .onSuccess(() => this.containersStore.reload(), this.destroyRef);
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
