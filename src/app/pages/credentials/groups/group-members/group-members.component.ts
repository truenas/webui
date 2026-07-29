import {
  ChangeDetectionStrategy, Component, DestroyRef, OnInit, signal, inject, computed,
} from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import {
  TnCardAction, TnCardComponent, TnCardHeaderDirective, TnProgressBarComponent, tnIconMarker,
} from '@truenas/ui-components';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Role } from 'app/enums/role.enum';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { AuthService } from 'app/modules/auth/auth.service';
import { ReadOnlyComponent } from 'app/modules/forms/ix-forms/components/readonly-badge/readonly-badge.component';
import { DualListBoxComponent } from 'app/modules/lists/dual-listbox/dual-listbox.component';
import { SnackbarService } from 'app/modules/snackbar/services/snackbar.service';
import { ApiService } from 'app/modules/websocket/api.service';
import { ErrorHandlerService } from 'app/services/errors/error-handler.service';

@Component({
  selector: 'ix-group-members',
  templateUrl: './group-members.component.html',
  styleUrls: ['./group-members.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DualListBoxComponent,
    TnCardComponent,
    TnCardHeaderDirective,
    TnProgressBarComponent,
    ReadOnlyComponent,
    TranslateModule,
  ],
})
export class GroupMembersComponent implements OnInit {
  private api = inject(ApiService);
  private activatedRoute = inject(ActivatedRoute);
  private router = inject(Router);
  private errorHandler = inject(ErrorHandlerService);
  private snackbar = inject(SnackbarService);
  private translate = inject(TranslateService);
  private authService = inject(AuthService);
  private destroyRef = inject(DestroyRef);

  protected readonly requiredRoles = [Role.AccountWrite];
  protected readonly tnIconMarker = tnIconMarker;
  protected selectedMembers: User[] = [];
  protected readonly users = signal<User[]>([]);

  protected readonly isLoading = signal(false);
  protected readonly group = signal<Group | null>(null);

  protected readonly hasAccountWrite = toSignal(
    this.authService.hasRole(this.requiredRoles),
    { initialValue: false },
  );

  protected readonly primaryAction = computed<TnCardAction | undefined>(() => {
    if (!this.hasAccountWrite()) {
      return undefined;
    }
    return {
      label: this.translate.instant('Save'),
      handler: () => this.onSubmit(),
      disabled: this.isLoading(),
      testId: 'save',
    };
  });

  protected readonly secondaryAction = computed<TnCardAction>(() => ({
    label: this.translate.instant('Cancel'),
    handler: () => this.onCancel(),
    testId: 'cancel',
  }));

  ngOnInit(): void {
    this.isLoading.set(true);
    this.activatedRoute.params.pipe(
      switchMap((params) => forkJoin([
        this.api.call('group.query', [[['id', '=', parseInt(params.pk as string)]]]),
        this.api.call('user.query', [[['local', '=', true]]]),
      ])),
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: ([groups, users]) => {
        const group = groups[0];

        if (!group) {
          this.isLoading.set(false);
          this.snackbar.error(this.translate.instant('Group not found.'));
          this.router.navigate(['/', 'credentials', 'groups']);
          return;
        }

        if (!group.local) {
          this.isLoading.set(false);
          this.snackbar.error(this.translate.instant('Cannot manage members for directory service groups.'));
          this.router.navigate(['/', 'credentials', 'groups']);
          return;
        }

        this.group.set(group);
        this.users.set(users);
        this.selectedMembers = users.filter((user) => group.users.includes(user.id));
        this.isLoading.set(false);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
        this.router.navigate(['/', 'credentials', 'groups']);
      },
    });
  }

  protected onCancel(): void {
    this.router.navigate(['/', 'credentials', 'groups']);
  }

  protected onSubmit(): void {
    this.isLoading.set(true);

    const userIds = this.selectedMembers.map((user) => user.id);
    this.api.call('group.update', [this.group().id, { users: userIds }]).pipe(
      takeUntilDestroyed(this.destroyRef),
    ).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.router.navigate(['/', 'credentials', 'groups']);
      },
      error: (error: unknown) => {
        this.isLoading.set(false);
        this.errorHandler.showErrorModal(error);
      },
    });
  }
}
