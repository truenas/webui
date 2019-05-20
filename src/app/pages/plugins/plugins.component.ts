import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { WebSocketService, EngineerModeService, JailService } from '../../services';
import * as _ from 'lodash';

@Component({
    selector: 'app-plugins-list',
    templateUrl: './plugins.component.html',
    styleUrls: ['./plugins.component.css'],
    providers: [JailService]
})
export class PluginsComponent implements OnInit {
    public title = "Available Plugins";
    protected queryCall = 'jail.list_resource';
    protected queryCallOption = ["PLUGIN", true];

    public plugins: any;
    public selectedPlugin: any;
    public engineerMode: boolean;
    public availableBranches = [];
    public selectedBranch: any;
    constructor(private ws: WebSocketService, protected engineerModeService: EngineerModeService, protected jailService: JailService,
                private router: Router) {
        this.engineerMode = localStorage.getItem('engineerMode') === 'true' ? true : false;
        this.engineerModeService.engineerMode.subscribe((res) => {
            this.engineerMode = res === 'true' ? true : false;
        });
        this.jailService.getBranches().subscribe(
            (res) => {
                for (let i = 0; i < res.length; i++) {
                    const branchIndexObj = _.find(this.availableBranches, { name: res[i].repo });
                    if (branchIndexObj == undefined) {
                        this.availableBranches.push({ name: res[i].repo, branches: [{ label: res[i].name, value: res[i].name }] })
                    } else {
                        branchIndexObj.branches.push({ label: res[i].name, value: res[i].name });
                    }
                }
            }
        )
        this.jailService.getVersion().subscribe(
            (res) => {
                this.selectedBranch = res;
            }
        )
    }

    ngOnInit() {
        this.getPlugin();
    }

    getPlugin() {
        this.ws.call(this.queryCall, this.queryCallOption).subscribe(
            (res) => {
                console.log(res);
                this.plugins = res;
                this.selectedPlugin = res[0];
            },
            (err) => {

            });
    }

    switchBranch() {
        this.queryCallOption = ["PLUGIN", true, true, this.selectedBranch];
        this.getPlugin();
    }

    install(plugin) {
        this.router.navigate(new Array('').concat(["plugins", "add", plugin]));
    }

}
