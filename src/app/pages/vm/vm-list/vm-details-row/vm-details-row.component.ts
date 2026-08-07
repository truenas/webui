import {
  Component, ChangeDetectionStrategy, DestroyRef, input, computed, inject,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { TnButtonComponent, TnDialog, TnTooltipDirective } from '@truenas/ui-components';
import { RequiresRolesDirective } from 'app/directives/requires-roles/requires-roles.directive';
import { Role } from 'app/enums/role.enum';
import { VmState } from 'app/enums/vm.enum';
import { helptextVmList } from 'app/helptext/vm/vm-list';
import { VirtualMachine } from 'app/interfaces/virtual-machine.interface';
import { LoaderService } from 'app/modules/loader/loader.service';
import { FormSidePanelService } from 'app/modules/slide-ins/form-side-panel/form-side-panel.service';
import { VmEditFormComponent } from 'app/pages/vm/vm-edit-form/vm-edit-form.component';
import { CloneVmDialogComponent } from 'app/pages/vm/vm-list/clone-vm-dialog/clone-vm-dialog.component';
import { DeleteVmDialogComponent } from 'app/pages/vm/vm-list/delete-vm-dialog/delete-vm-dialog.component';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';
import { VmService } from 'app/services/vm.service';

@Component({
  selector: 'ix-vm-details-row',
  templateUrl: './vm-details-row.component.html',
  styleUrls: ['./vm-details-row.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    RequiresRolesDirective,
    TnButtonComponent,
    TnTooltipDirective,
    TranslateModule,
  ],
})
export class VirtualMachineDetailsRowComponent {
  private loader = inject(LoaderService);
  private formPanel = inject(FormSidePanelService);
  private translate = inject(TranslateService);
  private tnDialog = inject(TnDialog);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);
  private vmService = inject(VmService);
  private destroyRef = inject(DestroyRef);

  readonly vm = input.required<VirtualMachine>();

  protected readonly requiredReadRoles = [Role.VmRead];
  protected readonly requiredRoles = [Role.VmWrite];

  /**
   * TEMP (NAS-141021): `tn-button` has no tooltip input (still the case in 0.4.9 — only
   * `tn-icon-button` and `tn-icon` have one), so `[tnTooltip]` sits on the host element rather
   * than the native button it renders — the hover tooltip still works, but its
   * `aria-describedby` lands on a non-focusable wrapper. The warning is not lost: the
   * confirmation dialog repeats it where the user has to act. Bind a real input once the
   * library grows one.
   */
  protected readonly resetTooltip = this.translate.instant(
    helptextVmList.resetButton.tooltip,
    { warning: this.translate.instant(helptextVmList.hardResetWarning) },
  );

  /**
   * The Reset button sits next to Restart and the two sound alike, so the accessible name spells
   * out that this one is a hard reset. The consequences stay out of the name — the tooltip carries
   * them as a description and the confirmation dialog repeats them where the user has to act.
   */
  protected readonly resetAriaLabel = this.translate.instant(helptextVmList.resetButton.ariaLabel);

  readonly vmStateInfo = computed(() => {
    const state = this.vm().status.state;
    return {
      isRunning: state === VmState.Running,
      isSuspended: state === VmState.Suspended,
    };
  });

  readonly showDisplayButton = computed(() => this.vmStateInfo().isRunning && this.vm().display_available);

  protected doStart(): void {
    this.vmService.doStartResume(this.vm()).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  protected doStop(): void {
    this.vmService.doStop(this.vm()).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe();
  }

  protected doRestart(): void {
    this.vmService
      .doRestart(this.vm())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        complete: () => this.vmService.checkMemory(),
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
      });
  }

  protected doReset(): void {
    this.vmService
      .doReset(this.vm())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe();
  }

  protected doPowerOff(): void {
    this.vmService.doPowerOff(this.vm());
  }

  protected openDisplay(): void {
    this.vmService.openDisplay(this.vm());
  }

  protected openDevices(): void {
    this.router.navigate(['/vm', String(this.vm().id), 'devices']);
  }

  protected openSerialShell(): void {
    this.router.navigate(['/vm', String(this.vm().id), 'serial']);
  }

  protected doEdit(): void {
    this.formPanel.open(VmEditFormComponent, {
      title: this.translate.instant('Edit VM'),
      inputs: { vmToEdit: this.vm() },
    });
  }

  protected doDelete(): void {
    this.tnDialog.open(DeleteVmDialogComponent, { data: this.vm() });
  }

  protected doClone(): void {
    this.tnDialog.open(CloneVmDialogComponent, { data: this.vm() });
  }

  protected downloadLogs(): void {
    this.vmService
      .downloadLogs(this.vm())
      .pipe(this.loader.withLoader(), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        error: (error: unknown) => this.errorHandler.showErrorModal(error),
      });
  }
}
