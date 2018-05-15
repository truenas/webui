import {Component, OnInit} from '@angular/core';
import {RestService} from "../../../../services/rest.service";
import {ActivatedRoute, Params, Router} from "@angular/router";
import {WebSocketService} from "../../../../services/ws.service";
import {AppLoaderService} from "../../../../services/app-loader/app-loader.service";
import { TranslateService } from '@ngx-translate/core'

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


  constructor(private loading: AppLoaderService,
              private ws: WebSocketService,
              private activatedRoute: ActivatedRoute,
              private router: Router,
              public translate: TranslateService) {
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe((res: Params) => this.group.id = res.pk);
    this.getGroupDetails();
    //this.getMembers();
  }

  getGroupDetails() {
    let myFilter = [];
    myFilter.push("id");
    myFilter.push("=");
    myFilter.push(this.group.id);
    const group$ = this.ws.call('group.query', [[myFilter]]);

    this.ws.call('group.query', [[myFilter]]).subscribe((groupInfo)=>{
      this.groupName = groupInfo[0].group;
    })
    group$.flatMap(group => {
      myFilter = [];
      myFilter.push("id");
      myFilter.push("in");
      myFilter.push(group[0].users);
      return this.ws.call('user.query', [[myFilter]])
    }).subscribe(users => {
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
  }

  cancel() {
    this.router.navigate(['/', 'account', 'groups']);
  }

  updateUsers() {
    const users = this.selectedMembers.map(x => x.id);
    const grp = this.ws.call('group.update', [this.group.id, {users}]);
    this.loading.open('Updating group members');
    grp.subscribe(res => {
      this.router.navigate(['/', 'account', 'groups']);
      this.loading.close();
    })
  }
}
