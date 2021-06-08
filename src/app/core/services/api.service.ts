import { Injectable } from '@angular/core';
import { UntilDestroy, untilDestroyed } from '@ngneat/until-destroy';
import { ApiMethod } from 'app/interfaces/api-directory.interface';
import { CoreEvent } from 'app/interfaces/events';
import { WebSocketService } from 'app/services/ws.service';
import { CoreService } from './core.service';

export interface ApiCall {
  version: string;
  namespace: ApiMethod; // namespace for ws and path for rest
  args?: any;
  responseEvent?: any;// The event name of the response this service will send
  errorResponseEvent?: any;// The event name of the response this service will send in case it fails
}

interface ApiDefinition {
  apiCall: ApiCall;
  preProcessor?: (def: ApiCall) => ApiCall;
  postProcessor?: (res: ApiCall, callArgs: any, core: any) => any;
}

@UntilDestroy()
@Injectable()
export class ApiService {
  private apiDefinitions: { [eventName: string]: ApiDefinition } = {
    UserAttributesRequest: {
      apiCall: {
        version: '2.0',
        namespace: 'user.query',
        args: [] as any[], // eg. [["id", "=", "foo"]]
        responseEvent: 'UserAttributes',
      },
      preProcessor(def: ApiCall) {
        const clone = { ...def };
        clone.args = [[['id', '=', 1]]];
        return clone;
      },
      postProcessor(res: any) {
        const cloneRes = { ...res };
        return cloneRes[0].attributes;
      },
    },
    UserDataRequest: {
      apiCall: {
        version: '2.0',
        namespace: 'user.query',
        args: [] as any[], // eg. [["id", "=", "foo"]]
        responseEvent: 'UserData',
      },
    },
    UserDataUpdate: {
      apiCall: {
        version: '2.0',
        namespace: 'user.set_attribute',
        args: [] as any[],
      },
      preProcessor(def: ApiCall) {
        const uid = 1;
        const redef = { ...def };
        redef.args = [uid, 'preferences', def.args];
        return redef;
      },
      postProcessor(res: any, callArgs: any, core: any) {
        const cloneRes = { ...res };
        if (res == 1) {
          core.emit({ name: 'UserDataRequest', data: [[['id', '=', 1]]] });
        }
        return cloneRes;
      },
    },
    VolumeDataRequest: {
      apiCall: {
        version: '2.0',
        namespace: 'pool.dataset.query',
        args: [] as any[],
        responseEvent: 'VolumeData',
      },
      preProcessor(def: ApiCall) {
        const queryFilters = [
          ['name', '~', '^[^\/]+$'], // Root datasets only
        ];

        return { args: [queryFilters], ...def };
      },
    },
    DisksRequest: {
      apiCall: {
        version: '2.0',
        args: [] as any[],
        namespace: 'disk.query',
        responseEvent: 'DisksData',
      },
    },
    MultipathRequest: {
      apiCall: {
        version: '2.0',
        args: [] as any[],
        namespace: 'multipath.query',
        responseEvent: 'MultipathData',
      },
    },
    EnclosureDataRequest: {
      apiCall: {
        version: '2.0',
        args: [] as any[],
        namespace: 'enclosure.query',
        responseEvent: 'EnclosureData',
      },
    },
    EnclosureUpdate: {
      apiCall: {
        version: '2.0',
        args: [] as any[],
        namespace: 'enclosure.update',
        responseEvent: 'EnclosureChanged',
      },
    },
    SetEnclosureLabel: {
      apiCall: {
        version: '2.0',
        args: [] as any[],
        namespace: 'enclosure.update',
        responseEvent: 'EnclosureLabelChanged',
      },
      preProcessor(def: ApiCall) {
        const redef = { ...def };
        const args = [def.args.id, { label: def.args.label }];
        redef.args = args;
        return redef;
      },
      postProcessor(res: any, callArgs: any) {
        return { label: res.label, index: callArgs.index, id: res.id };
      },
    },
    SetEnclosureSlotStatus: {
      apiCall: {
        version: '2.0',
        args: [] as any[],
        namespace: 'enclosure.set_slot_status',
        responseEvent: 'EnclosureSlotStatusChanged',
      },
    },
    PoolDataRequest: {
      apiCall: {
        version: '2.0',
        args: [] as any[],
        namespace: 'pool.query',
        responseEvent: 'PoolData',
      },
    },
    PoolDisksRequest: {
      apiCall: {
        version: '2.0',
        namespace: 'pool.get_disks',
        args: [] as any[],
        responseEvent: 'PoolDisks',
      },
      preProcessor(def: ApiCall) {
        const redef = { ...def };
        redef.responseEvent = def.args.length > 0 ? def.responseEvent + def.args.join() : def.responseEvent;
        return redef;
      },
      postProcessor(res: any, callArgs: any) {
        let cloneRes = { ...res };
        cloneRes = { callArgs, data: res };
        return cloneRes;
      },
    },
    PrimaryNicInfoRequest: {
      apiCall: {
        version: '2.0',
        namespace: 'interface.websocket_interface',
        args: [] as any[],
        responseEvent: 'PrimaryNicInfo',
      },
    },
    NicInfoRequest: {
      apiCall: {
        version: '2.0',
        namespace: 'interface.query',
        args: [] as any[],
        responseEvent: 'NicInfo',
      },
    },
    NetInfoRequest: {
      apiCall: {
        version: '2.0',
        namespace: 'network.general.summary',
        args: [] as any[],
        responseEvent: 'NetInfo',
      },
    },
    UpdateCheck: {
      apiCall: {
        version: '2.0',
        namespace: 'update.check_available',
        args: [] as any[],
        responseEvent: 'UpdateChecked',
      },
    },
    VmProfilesRequest: {
      apiCall: {
        version: '2.0', // Middleware returns device info but no status
        namespace: 'vm.query',
        args: [] as any[],
        responseEvent: 'VmProfiles',
      },
    },
    VmProfileRequest: {
      apiCall: {
        version: '2.0',
        namespace: 'vm.query',
        args: [] as any[], // eg. [["id", "=", "foo"]]
        responseEvent: 'VmProfile',
      },
    },
    VmProfileUpdate: {
      apiCall: {
        version: '2.0',
        namespace: 'vm.update',
        args: [] as any[],
        responseEvent: 'VmProfileRequest',
      },
      postProcessor(res: any) {
        // DEBUG: console.log(res);
        let cloneRes = { ...res };
        cloneRes = [[['id', '=', res]]];// eg. [["id", "=", "foo"]]
        return cloneRes;
      },
    },
    VmStatusRequest: {
      apiCall: {
        version: '2.0',
        namespace: 'vm.query',
        args: [] as any[], // eg. [["id", "=", "foo"]]
        responseEvent: 'VmStatus',
      },
      postProcessor(res: any) {
        const cloneRes = [];
        for (const vmstatus of res) {
          cloneRes.push({ id: vmstatus.id, state: vmstatus.status.state });
        }
        return cloneRes;
      },
    },
    VmStart: {
      apiCall: {
        version: '1',
        namespace: 'vm.start',
        args: [] as any,
        responseEvent: 'VmProfiles',
        errorResponseEvent: 'VmStartFailure',
      },
      postProcessor(res: any, callArgs: any) {
        let cloneRes = { ...res };
        cloneRes = { id: callArgs[0], state: res }; // res:boolean
        return cloneRes;
      },
    },
    VmRestart: {
      apiCall: {
        version: '1',
        namespace: 'vm.restart',
        args: [] as any,
        responseEvent: 'VmProfiles',
        errorResponseEvent: 'VmStartFailure',
      },
      postProcessor(res: any, callArgs: any) {
        let cloneRes = { ...res };
        cloneRes = { id: callArgs[0], state: res }; // res:boolean
        return cloneRes;
      },
    },
    VmStop: {
      apiCall: {
        version: '1',
        namespace: 'vm.stop',
        args: [] as any,
        responseEvent: 'VmProfiles',
        errorResponseEvent: 'VmStopFailure',
      },
      postProcessor(res: any, callArgs: any) {
        let cloneRes = { ...res };
        cloneRes = { id: callArgs[0] }; // res:boolean
        return cloneRes;
      },
    },
    VmPowerOff: {
      apiCall: {
        version: '2',
        namespace: 'vm.stop',
        args: [] as any,
        responseEvent: 'VmProfiles',
        errorResponseEvent: 'VmStopFailure',
      },
      preProcessor(def: ApiCall) {
        const redef = { ...def };
        redef.args.push(true);
        return redef;
      },
      postProcessor(res: any, callArgs: any) {
        let cloneRes = { ...res };
        cloneRes = { id: callArgs[0] }; // res:boolean
        return cloneRes;
      },
    },
    VmCreate: {
      apiCall: {
        version: '1',
        namespace: 'vm.create',
        args: [] as any,
        responseEvent: 'VmProfiles',
      },
    },
    VmClone: {
      apiCall: {
        version: '2',
        namespace: 'vm.clone',
        args: [] as any,
        responseEvent: 'VmProfiles',
        errorResponseEvent: 'VmCloneFailure',
      },
      postProcessor(res: any) {
        let cloneRes = { ...res };
        cloneRes = null;
        return cloneRes;
      },
    },
    VmDelete: {
      apiCall: {
        version: '1',
        namespace: 'vm.delete',
        args: [] as any,
        errorResponseEvent: 'VmDeleteFailure',
        responseEvent: 'VmProfiles',
      },
    },
    // Used by stats service!!
    StatsRequest: {
      apiCall: {
        version: '2',
        namespace: 'stats.get_data',
        args: {},
        responseEvent: 'StatsData',
      },
      preProcessor(def: ApiCall) {
        const redef = { ...def };
        redef.responseEvent = 'Stats' + def.args.responseEvent;
        redef.args = def.args.args;
        return redef;
      },
      postProcessor(res: any, callArgs: any) {
        const cloneRes = { ...res };
        const legend = res.meta.legend;
        const l = [];
        for (const i in legend) {
          if (callArgs.legendPrefix) {
            const spl = legend[i].split(callArgs.legendPrefix);
            l.push(spl[1]);
          } else {
            l.push(legend[i]);
          }
        }
        cloneRes.meta.legend = l;
        return cloneRes;
      },
    },
    // Used by stats service!!
    StatsSourcesRequest: {
      apiCall: {
        version: '1',
        namespace: 'stats.get_sources',
        args: [] as any,
        responseEvent: 'StatsSources',
      },
    },
    ReportingGraphsRequest: {
      apiCall: {
        version: '2',
        namespace: 'reporting.graphs',
        args: [] as any,
        responseEvent: 'ReportingGraphs',
      },
    },
    StatsCpuRequest: {
      apiCall: {
        version: '1',
        namespace: 'stats.get_data',
        args: [] as any,
        responseEvent: 'StatsData',
      },
      preProcessor(def: ApiCall) {
        const redef = { ...def };
        // Do some stuff here
        const dataList = [];
        const oldDataList = redef.args[0];
        const options = redef.args[1];

        for (const i in oldDataList) {
          dataList.push({
            source: 'aggregation-cpu-sum',
            type: 'cpu-' + oldDataList[i],
            dataset: 'value',
          });
        }

        redef.args = [dataList, options];
        redef.responseEvent = 'StatsCpuData';
        return redef;
      },
      postProcessor(res: any) {
        const cloneRes = { ...res };
        const legend = res.meta.legend;
        const l = [];
        for (const i in legend) {
          const spl = legend[i].split('aggregation-cpu-sum/cpu-');
          l.push(spl[1]);
        }
        cloneRes.meta.legend = l;
        return cloneRes;
      },
    },
    StatsMemoryRequest: {
      apiCall: {
        version: '1',
        namespace: 'stats.get_data',
        args: [] as any,
        responseEvent: 'StatsData',
      },
      preProcessor(def: ApiCall) {
        const redef = { ...def };
        // Do some stuff here

        const dataList = [];
        const oldDataList = redef.args[0];
        const options = redef.args[1];

        for (const i in oldDataList) {
          dataList.push({
            source: 'memory',
            type: 'memory-' + oldDataList[i],
            dataset: 'value',
          });
        }

        redef.args = [dataList, options];
        redef.responseEvent = 'StatsMemoryData';
        return redef;
      },
      postProcessor(res: any) {
        const cloneRes = { ...res };
        const legend = res.meta.legend;
        const l = [];
        for (const i in legend) {
          const spl = legend[i].split('memory/memory-');
          l.push(spl[1]);
        }
        cloneRes.meta.legend = l;
        return cloneRes;
      },
    },
    StatsDiskTempRequest: {
      apiCall: {
        version: '2',
        namespace: 'stats.get_data',
        args: [] as any,
        responseEvent: 'StatsData',
      },
      preProcessor(def: ApiCall) {
        // Clone the object
        const redef = { ...def };
        const dataList = [];
        const oldDataList = redef.args[0];

        // eslint-disable-next-line unused-imports/no-unused-vars
        for (const i in oldDataList) {
          dataList.push({
            source: 'disktemp-' + oldDataList, // disk name
            type: 'temperature',
            dataset: 'value',
          });
        }

        redef.args = [dataList];
        redef.responseEvent = 'StatsDiskTemp';
        return redef;
      },
      postProcessor(res: any, callArgs: any) {
        const cloneRes = { ...res };
        const legend = res.meta.legend;
        const l = [];
        for (const i in legend) {
          const spl = legend[i];
          l.push(spl[1]);
        }
        cloneRes.meta.legend = l;
        return { callArgs, data: cloneRes };
      },
    },
    StatsLoadAvgRequest: {
      apiCall: {
        version: '1',
        namespace: 'stats.get_data',
        args: [] as any,
        responseEvent: 'StatsData',
      },
      preProcessor(def: ApiCall) {
        const redef = { ...def };
        // Do some stuff here
        const dataList = [];
        const oldDataList = redef.args[0];
        const options = redef.args[1];

        for (const i in oldDataList) {
          dataList.push({
            source: 'processes',
            type: 'ps_' + oldDataList[i],
            dataset: 'value',
          });
        }

        redef.args = [dataList, options];
        redef.responseEvent = 'StatsLoadAvgData';
        return redef;
      },
      postProcessor(res: any) {
        const cloneRes = { ...res };
        const legend = res.meta.legend;
        const l = [];
        for (const i in legend) {
          const spl = legend[i].split('processes/ps_state-');
          l.push(spl[1]);
        }
        cloneRes.meta.legend = l;
        return cloneRes;
      },
    },
    StatsVmemoryUsageRequest: {
      apiCall: {
        version: '2.0',
        namespace: 'vm.get_vmemory_in_use',
        args: [] as any[], // eg. [["id", "=", "foo"]]
        responseEvent: 'StatsVmemoryUsage',
      },
    },
    DisksInfoRequest: {
      apiCall: {
        version: '2.0',
        namespace: 'disk.query',
        args: [] as any[],
        responseEvent: 'DisksInfo',
      },
    },
    SensorDataRequest: {
      apiCall: {
        version: '2.0',
        namespace: 'sensor.query',
        args: [] as any[],
        responseEvent: 'SensorData',
      },
    },
  };

  constructor(
    protected core: CoreService,
    protected ws: WebSocketService,
  ) {
    this.ws.authStatus.pipe(untilDestroyed(this)).subscribe((evt: any) => {
      this.core.emit({ name: 'UserDataRequest', data: [[['id', '=', 1]]] });
      this.core.emit({ name: 'Authenticated', data: evt, sender: this });
    });
    this.registerDefinitions();
  }

  registerDefinitions(): void {
    // DEBUG: console.log("APISERVICE: Registering API Definitions");
    for (const def in this.apiDefinitions) {
      // DEBUG: console.log("def = " + def);
      this.core.register({ observerClass: this, eventName: def }).pipe(untilDestroyed(this)).subscribe(
        (evt: CoreEvent) => {
          // Process Event if CoreEvent is in the api definitions list
          // TODO: Proper type:
          const name = evt.name as keyof ApiService['apiDefinitions'];
          if (this.apiDefinitions[name]) {
            // DEBUG: console.log(evt);
            const apiDef = this.apiDefinitions[name];
            // DEBUG: console.log(apiDef)
            // let call = this.parseCoreEvent(evt);
            this.callWebsocket(evt, apiDef);
          }
        },
        () => {
          // DEBUG: console.log(err)
        },
      );
    }
  }

  async callWebsocket(evt: CoreEvent, def: any): Promise<void> {
    const cloneDef = { ...def };
    const async_calls = [
      'vm.start',
      'vm.delete',
    ];

    if (evt.data) {
      cloneDef.apiCall.args = evt.data;

      if (def.preProcessor && !async_calls.includes(def.apiCall.namespace)) {
        cloneDef.apiCall = def.preProcessor(def.apiCall, this);
      }

      // PreProcessor: ApiDefinition manipulates call to be sent out.
      if (def.preProcessor && async_calls.includes(def.apiCall.namespace)) {
        cloneDef.apiCall = await def.preProcessor(def.apiCall, this);
        if (!cloneDef.apiCall) {
          this.core.emit({ name: 'VmStopped', data: { id: evt.data[0] } });
          return;
        }
      }

      const call = cloneDef.apiCall;// this.parseEventWs(evt);
      this.ws.call(call.namespace, call.args).pipe(untilDestroyed(this)).subscribe((res) => {
        // PostProcess
        if (def.postProcessor) {
          res = def.postProcessor(res, evt.data, this.core);
        }
        // this.core.emit({name:call.responseEvent, data:res, sender: evt.data}); // OLD WAY
        if (call.responseEvent) {
          this.core.emit({ name: call.responseEvent, data: res, sender: this });
        }
      },
      (error) => {
        error.id = call.args;
        if (call.errorResponseEvent) {
          this.core.emit({ name: call.errorResponseEvent, data: error, sender: this });
        }
        this.core.emit({ name: call.responseEvent, data: error, sender: this });
      });
    } else {
      // PreProcessor: ApiDefinition manipulates call to be sent out.
      if (def.preProcessor) {
        cloneDef.apiCall = def.preProcessor(def.apiCall);
      }

      const call = cloneDef.apiCall;// this.parseEventWs(evt);
      this.ws.call(call.namespace, call.args || []).pipe(untilDestroyed(this)).subscribe((res) => {
        // PostProcess
        if (def.postProcessor) {
          res = def.postProcessor(res, evt.data, this.core);
        }

        // this.core.emit({name:call.responseEvent, data:res, sender:evt.data }); // OLD WAY
        if (call.responseEvent) {
          this.core.emit({ name: call.responseEvent, data: res, sender: this });
        }
      }, (error) => {
        console.error(error);
        if (call.responseFailedEvent) {
          error.id = call.args;
          this.core.emit({ name: call.responseFailedEvent, data: error, sender: this });
        }
      });
    }
  }
}
