import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { switchMap } from 'rxjs/operators';
import { Group } from 'app/interfaces/group.interface';
import { User } from 'app/interfaces/user.interface';
import { EntityUtils } from 'app/modules/entity/utils';
import { DialogService } from 'app/services';
import { WebSocketService } from 'app/services/ws.service';

@UntilDestroy()
@Component({
  templateUrl: './group-members.component.html',
  styleUrls: ['./group-members.component.scss'],
})
export class GroupMembersComponent implements OnInit {
  members: User[] = [];
  selectedMembers: User[] = [];
  users: User[] = [];

  isFormLoading = false;
  group: Group;

  constructor(
    private ws: WebSocketService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dialog: DialogService,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
    this.activatedRoute.params.pipe(
      switchMap((params) => this.ws.call('group.query', [[['id', '=', parseInt(params.pk)]]])),
      switchMap((groups) => {
        this.group = groups[0];
        return this.ws.call('user.query');
      }),
      untilDestroyed(this),
    ).subscribe((users) => {
      this.users = users;
      const members = users.filter((user) => this.group.users.includes(user.id));
      this.members = members;
      this.selectedMembers = members;
      this.isFormLoading = false;
    });
  }

  onCancel(): void {
    this.router.navigate(['/', 'credentials', 'groups']);
  }

  onSubmit(): void {
    this.isFormLoading = true;

    const userIds = this.selectedMembers.map((user) => user.id);
    this.ws.call('group.update', [this.group.id, { users: userIds }]).pipe(
      untilDestroyed(this),
    ).subscribe({
      next: () => {
        this.isFormLoading = false;
        this.router.navigate(['/', 'credentials', 'groups']);
      },
      error: (error) => {
        this.isFormLoading = false;
        new EntityUtils().handleWsError(this, error, this.dialog);
      },
    });
  }
}
