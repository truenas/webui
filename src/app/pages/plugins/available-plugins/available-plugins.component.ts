import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

import { WebSocketService, JailService } from '../../../services';
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

    protected queryCall = 'plugin.available';
    protected queryCallOption = {'plugin_repository': 'https://github.com/freenas/iocage-ix-plugins.git'};

    public plugins: any;
    public selectedPlugin: any;
    public isSelectedOffical = true;
    public availableRepo = [];
    public selectedRepo: any;
    public installedPlugins: any = {};

    constructor(private ws: WebSocketService, protected jailService: JailService,
                private router: Router) {
        this.ws.call('plugin.official_repositories').subscribe(
            (res) => {
                for (const repo in res) {
                    this.availableRepo.push(res[repo]);
                }
                this.selectedRepo = this.availableRepo[0].git_repository;
            },
            (err) => {
                new EntityUtils().handleWSError(this.parent, err, this.parent.dialogService);
            }
        )
    }

    getInstances() {
        this.ws.call('plugin.query').subscribe(
            (res) => {
                for (const item of res) {
                    if (this.installedPlugins[item.plugin] == undefined) {
                        this.installedPlugins[item.plugin] = 0;
                    }
                    this.installedPlugins[item.plugin]++;
                }
            }
        )
    }

    ngOnInit() {
        this.getInstances();
        this.getPlugin();
    }

    getPlugin(cache = true) {
        this.parent.cardHeaderReady = false;
        this.queryCallOption['cache'] = cache;

        this.ws.job(this.queryCall, [this.queryCallOption]).subscribe(
            (res) => {
                if (res.result) {
                    this.plugins = res.result;
                    this.selectedPlugin = res.result[0];
                    this.parent.cardHeaderReady = true;
                }
                if (res.error) {
                    this.parent.dialogService.errorReport('Get Plugins Failed', res.error, res.exception);
                }
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

    switchRepo(event) {
        this.parent.loader.open();
        this.parent.loaderOpen = true;
        this.queryCallOption.plugin_repository = this.selectedRepo;
        this.getPlugin();
    }

    install(plugin) {
        this.router.navigate(new Array('').concat(["plugins", "add", plugin, {'plugin_repository': this.selectedRepo}]));
    }

}
