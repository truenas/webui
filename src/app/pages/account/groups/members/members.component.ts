import {mergeMap} from 'rxjs/operators';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params, Router} from "@angular/router";
import {WebSocketService} from "../../../../services/ws.service";
import {AppLoaderService} from "../../../../services/app-loader/app-loader.service";
import { TranslateService } from '@ngx-translate/core'
import helptext from '../../../../helptext/account/members';

@Component({
  selector: 'app-members',
  templateUrl: './members.component.html',
  styleUrls: ['./members.component.css']
})
export class MembersComponent implements OnInit {

  members: any[] = [];
  selectedMembers: any[] = [];
  group = {
    id: '',
    name: ''
  };
  users: any[] = [];
  groupName= ""
  public showSpinner: boolean = true;


  constructor(private loading: AppLoaderService,
              private ws: WebSocketService,
              private activatedRoute: ActivatedRoute,
              private router: Router,
              public translate: TranslateService) {
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((res: Params) => this.group.id = res.pk);
    this.getGroupDetails();
  }

  getGroupDetails() {
    let myFilter = [];
    myFilter.push("id");
    myFilter.push("=");
    myFilter.push(parseInt(this.group.id));
    const group$ = this.ws.call('group.query', [[myFilter]]);

    this.ws.call('group.query', [[myFilter]]).subscribe((groupInfo)=>{
      this.groupName = groupInfo[0].group;
    })
    group$.pipe(mergeMap(group => {
      myFilter = [];
      myFilter.push("id");
      myFilter.push("in");
      myFilter.push(group[0].users);
      return this.ws.call('user.query', [[myFilter]])
    })).subscribe(users => {
      this.users = users;
      this.selectedMembers = users;
      this.getMembers();
    }, err => console.log('group err', err));
  }

  getMembers() {
    this.ws.call('user.query').subscribe(res => {
      for (const usr of res) {
        const idx = this.users.findIndex(x => usr.id === x.id);
        if (idx === -1) {
          this.members.push(usr);
        }
      }
    }, err => console.log(err));
    this.showSpinner = false;
  }

  cancel() {
    this.router.navigate(['/', 'account', 'groups']);
  }

  updateUsers() {
    const users = this.selectedMembers.map(x => x.id);
    const grp = this.ws.call('group.update', [this.group.id, {users}]);
    this.loading.open(helptext.update_users_message);
    grp.subscribe(res => {
      this.router.navigate(['/', 'account', 'groups']);
      this.loading.close();
    })
  }
}
