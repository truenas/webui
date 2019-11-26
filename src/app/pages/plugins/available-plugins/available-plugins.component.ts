import { Component, OnInit, Input } from '@angular/core';
import { Router } from '@angular/router';

import { WebSocketService, JailService, DialogService } from '../../../services';
import * as _ from 'lodash';
import { EntityUtils } from '../../common/entity/utils';
import { T } from '../../../translate-marker';

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
    protected queryCallOption = {};

    public plugins: any;
    public selectedPlugin: any;
    public isSelectedOffical = true;
    public availableRepo = [];
    public selectedRepo: any;
    public installedPlugins: any = {};

    constructor(private ws: WebSocketService, protected jailService: JailService,
                private router: Router, protected dialogService: DialogService) {
        this.ws.call('plugin.official_repositories').subscribe(
            (res) => {
                for (const repo in res) {
                    this.availableRepo.push(res[repo]);
                }
                if (this.availableRepo.length === 0) {
                    this.dialogService.Info(T('No Repositories'), T('No repositories is found.'), '500px', 'info', true);
                } else {
                    const officialRepo = this.availableRepo.filter(repo => repo.name === 'iXsystems');
                    this.selectedRepo = officialRepo.length > 0 ? officialRepo[0]['git_repository'] : this.availableRepo[0]['git_repository'];
                }
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
        this.queryCallOption['plugin_repository'] = this.selectedRepo;
        this.queryCallOption['cache'] = cache;

        this.ws.job(this.queryCall, [this.queryCallOption]).subscribe(
            (res) => {
                if (res.result) {
                    this.plugins = res.result;
                    for (let i=0; i<this.plugins.length; i++) {
                        let revision = this.plugins[i]['revision'];
                        if (revision !== 'N/A' && revision !== '0' ) {
                            revision = '_' + revision;
                        } else {
                            revision = '';
                        }
                        this.plugins[i]['version'] = this.plugins[i]['version'] + revision;
                    }
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
        this.queryCallOption['plugin_repository'] = this.selectedRepo;
        this.getPlugin();
    }

    install(plugin) {
        if (!plugin.official) {
            this.parent.dialogService.confirm(
                T('Warning'),
                T('This is an unofficial plugin not produced or supported by iXsystems. iXsystems does\
 not provide support in configuration, diagnosis, or use of this unofficial plugin regardless of the current\
 support level. Thorough research is strongly recommended before installing or using an unofficial plugin.'),
                true, T('Continue')
            ).subscribe(
                (res) => {
                    if (res) {
                        this.router.navigate(new Array('').concat(["plugins", "add", plugin.plugin, {'plugin_repository': this.selectedRepo}]));
                    }
                }
            )
        } else {
            this.router.navigate(new Array('').concat(["plugins", "add", plugin.plugin, {'plugin_repository': this.selectedRepo}]));
        }
    }

}
