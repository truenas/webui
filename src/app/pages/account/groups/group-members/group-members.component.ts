import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
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
  groupId = '';
  groupName = '';

  constructor(
    private ws: WebSocketService,
    private activatedRoute: ActivatedRoute,
    private router: Router,
    private dialog: DialogService,
  ) {}

  ngOnInit(): void {
    this.isFormLoading = true;
    this.activatedRoute.params.pipe(
      untilDestroyed(this),
    ).subscribe((params: Params) => {
      this.groupId = params.pk;
      this.getGroupDetails();
    });
  }

  getGroupDetails(): void {
    this.ws.call('group.query', [[['id', '=', parseInt(this.groupId)]]]).pipe(
      switchMap((groups) => {
        this.groupName = groups[0].group;
        return this.ws.call('user.query', [[['id', 'in', groups[0].users]]]);
      }),
      switchMap((users) => {
        this.users = users;
        this.selectedMembers = users;
        return this.getMembers();
      }),
      untilDestroyed(this),
    ).subscribe((members) => {
      this.members.push(...members);
      this.isFormLoading = false;
    });
  }

  getMembers(): Observable<User[]> {
    return this.ws.call('user.query').pipe(
      map((users) => users.filter((user) => this.users.findIndex((x) => user.id === x.id))),
    );
  }

  onCancel(): void {
    this.router.navigate(['/', 'credentials', 'groups']);
  }

  onSubmit(): void {
    this.isFormLoading = true;

    const userIds = this.selectedMembers.map((user) => user.id);
    this.ws.call('group.update', [Number(this.groupId), { users: userIds }]).pipe(
      untilDestroyed(this),
    ).subscribe(() => {
      this.isFormLoading = false;
      this.router.navigate(['/', 'credentials', 'groups']);
    }, (error) => {
      this.isFormLoading = false;
      new EntityUtils().handleWsError(this, error, this.dialog);
    });
  }
}
