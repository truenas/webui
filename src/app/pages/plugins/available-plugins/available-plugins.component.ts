import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

import { WebSocketService, EngineerModeService, JailService } from '../../../services';
import * as _ from 'lodash';
import { EntityUtils } from '../../common/entity/utils';

@Component({
    selector: 'app-plugins-list',
    templateUrl: './available-plugins.component.html',
    styleUrls: ['./available-plugins.component.css'],
    providers: [JailService]
})
export class AvailablePluginsComponent implements OnInit {
    @Input() config: any;
    @Input() parent: any;

    protected queryCall = 'jail.list_resource';
    protected queryCallOption = ["PLUGIN", true];

    public plugins: any;
    public selectedPlugin: any;
    public isSelectedOffical = true;
    public engineerMode: boolean;
    public availableBranches = [];
    public selectedBranch: any;
    public installedPlugins: any = {};

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
                    if (branchIndexObj === undefined) {
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

    getInstances() {
        this.jailService.getInstalledPlugins().subscribe(
            (res) => {
                for (const item of res) {
                    const name = _.split(item[1],'_')[0];
                    if (this.installedPlugins[name] == undefined) {
                        this.installedPlugins[name] = 0;
                    }
                    this.installedPlugins[name]++;
                }
            }
        )
    }

    ngOnInit() {
        this.getInstances();
        this.getPlugin();
    }

    getPlugin() {
        this.ws.call(this.queryCall, this.queryCallOption).subscribe(
            (res) => {
                this.plugins = res;
                this.selectedPlugin = res[0];
                this.parent.cardHeaderReady = true;
            },
            (err) => {
                new EntityUtils().handleWSError(this.parent, err, this.parent.dialogService);
            },
            () => {
                if (this.parent.loaderOpen) {
                    this.parent.loader.close();
                    this.parent.loaderOpen = false;
                }
            });
    }

    switchBranch(event) {
        this.parent.loader.open();
        this.parent.loaderOpen = true;
        this.isSelectedOffical = event.source.selected.group.label === 'official';
        this.queryCallOption = ["PLUGIN", true, true, this.selectedBranch];
        this.getPlugin();
    }

    install(plugin) {
        this.router.navigate(new Array('').concat(["plugins", "add", plugin]));
    }

}
