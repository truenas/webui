import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { UUID } from 'angular2-uuid';
import {
  merge, Observable, of, Subject, Subscriber, throwError,
} from 'rxjs';
import {
  filter, map, share, startWith, switchMap, take, takeUntil, tap,
} from 'rxjs/operators';
import { IncomingApiMessageType } from 'app/enums/api-message-type.enum';
import { ResponseErrorType } from 'app/enums/response-error-type.enum';
import { WebSocketErrorName } from 'app/enums/websocket-error-name.enum';
import { applyApiEvent } from 'app/helpers/operators/apply-api-event.operator';
import { observeJob } from 'app/helpers/operators/observe-job.operator';
import { ApiCallAndSubscribeMethod, ApiCallAndSubscribeResponse } from 'app/interfaces/api/api-call-and-subscribe-directory.interface';
import {
  ApiCallMethod,
  ApiCallParams,
  ApiCallResponse,
} from 'app/interfaces/api/api-call-directory.interface';
import {
  ApiJobMethod,
  ApiJobParams,
  ApiJobResponse,
} from 'app/interfaces/api/api-job-directory.interface';
import {
  ApiEvent, ApiEventMethod, ApiEventTyped, IncomingWebSocketMessage, ResultMessage,
} from 'app/interfaces/api-message.interface';
import { Job } from 'app/interfaces/job.interface';
import { WebSocketError } from 'app/interfaces/websocket-error.interface';
import { WebSocketConnectionService } from 'app/services/websocket-connection.service';

@Injectable({
  providedIn: 'root',
})
export class WebSocketService {
  private readonly eventSubscribers = new Map<ApiEventMethod, Observable<ApiEventTyped>>();
  clearSubscriptions$ = new Subject<void>();

  constructor(
    protected router: Router,
    protected wsManager: WebSocketConnectionService,
    protected translate: TranslateService,
  ) {
    this.wsManager.isConnected$?.subscribe((isConnected) => {
      if (!isConnected) {
        this.clearSubscriptions();
      }
    });
  }

  private get ws$(): Observable<unknown> {
    return this.wsManager.websocket$;
  }

  call<M extends ApiCallMethod>(method: M, params?: ApiCallParams<M>): Observable<ApiCallResponse<M>> {
    if (method === 'webui.enclosure.dashboard') {
      return of([
        {
          name: 'iX 4024Sp e001',
          model: 'M50',
          controller: true,
          dmi: 'TRUENAS-M50-HA',
          status: [
            'OK',
          ],
          id: '5b0bd6d1a309b47f',
          vendor: 'iX',
          product: '4024Sp',
          revision: 'e001',
          bsg: '/dev/bsg/18:0:2:0',
          sg: '/dev/sg4',
          pci: '18:0:2:0',
          rackmount: true,
          top_loaded: false,
          front_loaded: true,
          top_slots: 0,
          front_slots: 24,
          rear_slots: 4,
          internal_slots: 0,
          elements: {
            'Array Device Slot': {
              1: {
                descriptor: 'slot00',
                status: 'OK',
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                dev: 'sdb',
                pool_info: {
                  pool_name: 'sanity',
                  disk_status: 'ONLINE',
                  vdev_name: 'mirror-0',
                  vdev_type: 'data',
                  vdev_disks: [
                    {
                      enclosure_id: '5b0bd6d1a309b47f',
                      slot: 1,
                      dev: 'sdb',
                    },
                    {
                      enclosure_id: '5b0bd6d1a309b47f',
                      slot: 2,
                      dev: 'sda',
                    },
                  ],
                },
              },
              2: {
                descriptor: 'slot01',
                status: 'OK',
                dev: 'sda',
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: {
                  pool_name: 'sanity',
                  disk_status: 'ONLINE',
                  vdev_name: 'mirror-0',
                  vdev_type: 'data',
                  vdev_disks: [
                    {
                      enclosure_id: '5b0bd6d1a309b47f',
                      slot: 1,
                      dev: 'sdb',
                    },
                    {
                      enclosure_id: '5b0bd6d1a309b47f',
                      slot: 2,
                      dev: 'sda',
                    },
                  ],
                },
              },
              3: {
                descriptor: 'slot02',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              4: {
                descriptor: 'slot03',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              5: {
                descriptor: 'slot04',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              6: {
                descriptor: 'slot05',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              7: {
                descriptor: 'slot06',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              8: {
                descriptor: 'slot07',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              9: {
                descriptor: 'slot08',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              10: {
                descriptor: 'slot09',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              11: {
                descriptor: 'slot10',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              12: {
                descriptor: 'slot11',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              13: {
                descriptor: 'slot12',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              14: {
                descriptor: 'slot13',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              15: {
                descriptor: 'slot14',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              16: {
                descriptor: 'slot15',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              17: {
                descriptor: 'slot16',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              18: {
                descriptor: 'slot17',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              19: {
                descriptor: 'slot18',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              20: {
                descriptor: 'slot19',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              21: {
                descriptor: 'slot20',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              22: {
                descriptor: 'slot21',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              23: {
                descriptor: 'slot22',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              24: {
                descriptor: 'slot23',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: false,
                is_internal: false,
                is_front: true,
                pool_info: null,
              },
              25: {
                descriptor: 'Disk #1',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: true,
                is_internal: false,
                is_front: false,
                pool_info: null,
              },
              26: {
                descriptor: 'Disk #2',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: true,
                is_internal: false,
                is_front: false,
                pool_info: null,
              },
              27: {
                descriptor: 'Disk #3',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: true,
                is_internal: false,
                is_front: false,
                pool_info: null,
              },
              28: {
                descriptor: 'Disk #4',
                status: 'Not installed',
                dev: null,
                is_top: false,
                is_rear: true,
                is_internal: false,
                is_front: false,
                pool_info: null,
              },
            },
            'SAS Expander': {
              26: {
                descriptor: 'SAS3 Expander',
                status: 'OK',
                value: null,
                value_raw: 16777216,
              },
            },
            Enclosure: {
              28: {
                descriptor: 'Encl-BpP',
                status: 'OK, Swapped',
                value: null,
                value_raw: 285212672,
              },
              29: {
                descriptor: 'Encl-PeerS',
                status: 'OK',
                value: null,
                value_raw: 16777216,
              },
            },
            'Temperature Sensors': {
              31: {
                descriptor: 'ExpP-Die',
                status: 'OK',
                value: '36C',
                value_raw: 16791552,
              },
              32: {
                descriptor: 'ExpS-Die',
                status: 'OK',
                value: '35C',
                value_raw: 16791296,
              },
              33: {
                descriptor: 'Sense BP1',
                status: 'OK',
                value: '19C',
                value_raw: 16787200,
              },
              34: {
                descriptor: 'Sense BP2',
                status: 'OK',
                value: '18C',
                value_raw: 16786944,
              },
            },
            'Voltage Sensor': {
              36: {
                descriptor: '5V Sensor',
                status: 'OK',
                value: '5.1V',
                value_raw: 16777726,
              },
              37: {
                descriptor: '12V Sensor',
                status: 'OK',
                value: '12.25V',
                value_raw: 16778441,
              },
            },
          },
          label: 'iX 4024Sp e001',
        },
        {
          name: 'CELESTIC X2012-MT 0443',
          model: 'ES12',
          controller: false,
          dmi: 'TRUENAS-M50-HA',
          status: [
            'OK',
          ],
          id: '500e0eca0651517f',
          vendor: 'CELESTIC',
          product: 'X2012-MT',
          revision: '0443',
          bsg: '/dev/bsg/20:0:0:0',
          sg: '/dev/sg6',
          pci: '20:0:0:0',
          rackmount: true,
          top_loaded: false,
          front_slots: 12,
          rear_slots: 0,
          internal_slots: 0,
          elements: {
            'Array Device Slot': {
              1: {
                descriptor: 'Drive Slot #0_0000000000000000',
                status: 'Not installed',
                dev: null,
                pool_info: null,
              },
              2: {
                descriptor: 'Drive Slot #1_0000000000000000',
                status: 'Not installed',
                dev: null,
                pool_info: null,
              },
              3: {
                descriptor: 'Drive Slot #2_0000000000000000',
                status: 'Not installed',
                dev: null,
                pool_info: null,
              },
              4: {
                descriptor: 'Drive Slot #3_0000000000000000',
                status: 'Not installed',
                dev: null,
                pool_info: null,
              },
              5: {
                descriptor: 'Drive Slot #4_0000000000000000',
                status: 'Not installed',
                dev: null,
                pool_info: null,
              },
              6: {
                descriptor: 'Drive Slot #5_0000000000000000',
                status: 'Not installed',
                dev: null,
                pool_info: null,
              },
              7: {
                descriptor: 'Drive Slot #6_0000000000000000',
                status: 'Not installed',
                dev: null,
                pool_info: null,
              },
              8: {
                descriptor: 'Drive Slot #7_0000000000000000',
                status: 'Not installed',
                dev: null,
                pool_info: null,
              },
              9: {
                descriptor: 'Drive Slot #8_0000000000000000',
                status: 'Not installed',
                dev: null,
                pool_info: null,
              },
              10: {
                descriptor: 'Drive Slot #9_0000000000000000',
                status: 'Not installed',
                dev: null,
                pool_info: null,
              },
              11: {
                descriptor: 'Drive Slot #10_0000000000000000',
                status: 'Not installed',
                dev: null,
                pool_info: null,
              },
              12: {
                descriptor: 'Drive Slot #11_0000000000000000',
                status: 'Not installed',
                dev: null,
                pool_info: null,
              },
            },
            'Power Supply': {
              13: {
                descriptor: 'Power Supply',
                status: 'OK',
                value: null,
                value_raw: 16777216,
              },
              14: {
                descriptor: 'PS A_0121',
                status: 'OK',
                value: 'RQST on',
                value_raw: 16777248,
              },
              15: {
                descriptor: 'PS B_0121',
                status: 'OK',
                value: 'RQST on',
                value_raw: 16777248,
              },
            },
            Cooling: {
              16: {
                descriptor: 'Cooling',
                status: 'OK',
                value: '0 RPM',
                value_raw: 16777216,
              },
              17: {
                descriptor: 'Virtual Fan Group #1_PS A',
                status: 'OK',
                value: '5350 RPM',
                value_raw: 16914177,
              },
              18: {
                descriptor: 'Virtual Fan Group #2_PS B',
                status: 'OK',
                value: '5310 RPM',
                value_raw: 16913153,
              },
              19: {
                descriptor: 'Fan #1_Virtual Fan Group #1',
                status: 'OK',
                value: '6100 RPM',
                value_raw: 16933377,
              },
              20: {
                descriptor: 'Fan #2_Virtual Fan Group #1',
                status: 'OK',
                value: '4500 RPM',
                value_raw: 16892417,
              },
              21: {
                descriptor: 'Fan #3_Virtual Fan Group #1',
                status: 'OK',
                value: '6200 RPM',
                value_raw: 16935937,
              },
              22: {
                descriptor: 'Fan #4_Virtual Fan Group #1',
                status: 'OK',
                value: '4700 RPM',
                value_raw: 16897537,
              },
              23: {
                descriptor: 'Fan #5_Virtual Fan Group #1',
                status: 'OK',
                value: '6100 RPM',
                value_raw: 16933377,
              },
              24: {
                descriptor: 'Fan #6_Virtual Fan Group #1',
                status: 'OK',
                value: '4500 RPM',
                value_raw: 16892417,
              },
              25: {
                descriptor: 'Fan #1_Virtual Fan Group #2',
                status: 'OK',
                value: '6100 RPM',
                value_raw: 16933377,
              },
              26: {
                descriptor: 'Fan #2_Virtual Fan Group #2',
                status: 'OK',
                value: '4600 RPM',
                value_raw: 16894977,
              },
              27: {
                descriptor: 'Fan #3_Virtual Fan Group #2',
                status: 'OK',
                value: '6100 RPM',
                value_raw: 16933377,
              },
              28: {
                descriptor: 'Fan #4_Virtual Fan Group #2',
                status: 'OK',
                value: '4600 RPM',
                value_raw: 16894977,
              },
              29: {
                descriptor: 'Fan #5_Virtual Fan Group #2',
                status: 'OK',
                value: '6100 RPM',
                value_raw: 16933377,
              },
              30: {
                descriptor: 'Fan #6_Virtual Fan Group #2',
                status: 'OK',
                value: '4400 RPM',
                value_raw: 16889857,
              },
            },
            'Temperature Sensors': {
              31: {
                descriptor: 'Temperature Sensor',
                status: 'OK',
                value: null,
                value_raw: 16777216,
              },
              32: {
                descriptor: 'Inlet Temperature_ESM A',
                status: 'OK',
                value: '20C',
                value_raw: 16787456,
              },
              33: {
                descriptor: 'Outlet Temperature_ESM A',
                status: 'OK',
                value: '20C',
                value_raw: 16787456,
              },
              34: {
                descriptor: 'SXP Temperature_ESM A',
                status: 'OK',
                value: '26C',
                value_raw: 16788992,
              },
              35: {
                descriptor: 'Inlet Temperature_ESM B',
                status: 'OK',
                value: '19C',
                value_raw: 16787200,
              },
              36: {
                descriptor: 'Outlet Temperature_ESM B',
                status: 'OK',
                value: '20C',
                value_raw: 16787456,
              },
              37: {
                descriptor: 'SXP Temperature_ESM B',
                status: 'OK',
                value: '25C',
                value_raw: 16788736,
              },
              38: {
                descriptor: 'Hotspot Temperature_PS A',
                status: 'OK',
                value: '34C',
                value_raw: 16791040,
              },
              39: {
                descriptor: 'Ambient Temperature_PS A',
                status: 'OK',
                value: '21C',
                value_raw: 16787712,
              },
              40: {
                descriptor: 'Primary Temperature_PS A',
                status: 'OK',
                value: '19C',
                value_raw: 16787200,
              },
              41: {
                descriptor: 'Hotspot Temperature_PS B',
                status: 'OK',
                value: '34C',
                value_raw: 16791040,
              },
              42: {
                descriptor: 'Ambient Temperature_PS B',
                status: 'OK',
                value: '20C',
                value_raw: 16787456,
              },
              43: {
                descriptor: 'Primary Temperature_PS B',
                status: 'OK',
                value: '19C',
                value_raw: 16787200,
              },
            },
            'Enclosure Services Controller Electronics': {
              44: {
                descriptor: 'ESM',
                status: 'OK',
                value: null,
                value_raw: 16777216,
              },
              45: {
                descriptor: 'ESM A_500E0ECA06515100',
                status: 'OK',
                value: null,
                value_raw: 16777600,
              },
              46: {
                descriptor: 'ESM B_500E0ECA06515140',
                status: 'OK',
                value: null,
                value_raw: 16777600,
              },
            },
            Enclosure: {
              47: {
                descriptor: 'EL LOBO Enclosure',
                status: 'OK',
                value: null,
                value_raw: 16777216,
              },
              48: {
                descriptor: 'EL LOBO Enclosure',
                status: 'OK',
                value: null,
                value_raw: 16777216,
              },
            },
            'Voltage Sensor': {
              49: {
                descriptor: 'Voltage Sensor',
                status: 'OK',
                value: '0.0V',
                value_raw: 16777216,
              },
              50: {
                descriptor: '0.92V Voltage_ESM A',
                status: 'OK',
                value: '0.93V',
                value_raw: 16777309,
              },
              51: {
                descriptor: '1.0V Voltage_ESM A',
                status: 'OK',
                value: '1.0V',
                value_raw: 16777316,
              },
              52: {
                descriptor: '1.8V Voltage_ESM A',
                status: 'OK',
                value: '1.8V',
                value_raw: 16777396,
              },
              53: {
                descriptor: '3.3V Voltage_ESM A',
                status: 'OK',
                value: '3.31V',
                value_raw: 16777547,
              },
              54: {
                descriptor: '0.92V Voltage_ESM B',
                status: 'OK',
                value: '0.92V',
                value_raw: 16777308,
              },
              55: {
                descriptor: '1.0V Voltage_ESM B',
                status: 'OK',
                value: '0.99V',
                value_raw: 16777315,
              },
              56: {
                descriptor: '1.8V Voltage_ESM B',
                status: 'OK',
                value: '1.77V',
                value_raw: 16777393,
              },
              57: {
                descriptor: '3.3V Voltage_ESM B',
                status: 'OK',
                value: '3.28V',
                value_raw: 16777544,
              },
            },
            'SAS Expander': {
              58: {
                descriptor: 'SXP Expander',
                status: 'OK',
                value: null,
                value_raw: 16777216,
              },
              59: {
                descriptor: 'SXP',
                status: 'OK',
                value: null,
                value_raw: 16777216,
              },
              60: {
                descriptor: 'SXP',
                status: 'OK',
                value: null,
                value_raw: 16777216,
              },
            },
            'SAS Connector': {
              61: {
                descriptor: 'SAS Connector',
                status: 'OK',
                value: 'No information',
                value_raw: 16777216,
              },
              62: {
                descriptor: 'Connector #1_ESM A',
                status: 'OK',
                value: 'Mini SAS HD 4x receptacle (SFF-8644) [max 4 phys]',
                value_raw: 17170176,
              },
              63: {
                descriptor: 'Connector #2_ESM A',
                status: 'OK',
                value: 'Mini SAS HD 4x receptacle (SFF-8644) [max 4 phys]',
                value_raw: 17170176,
              },
              64: {
                descriptor: 'Connector #3_ESM A',
                status: 'OK',
                value: 'Mini SAS HD 4x receptacle (SFF-8644) [max 4 phys]',
                value_raw: 17170176,
              },
              65: {
                descriptor: 'Connector #1_ESM B',
                status: 'OK',
                value: 'Mini SAS HD 4x receptacle (SFF-8644) [max 4 phys]',
                value_raw: 17170176,
              },
              66: {
                descriptor: 'Connector #2_ESM B',
                status: 'OK',
                value: 'Mini SAS HD 4x receptacle (SFF-8644) [max 4 phys]',
                value_raw: 17170176,
              },
              67: {
                descriptor: 'Connector #3_ESM B',
                status: 'OK',
                value: 'Mini SAS HD 4x receptacle (SFF-8644) [max 4 phys]',
                value_raw: 17170176,
              },
            },
          },
          label: 'CELESTIC X2012-MT 0443',
        },
      ]);
    }
    return this.callMethod(method, params);
  }

  /**
   * For jobs better to use the `selectJob` store selector.
   */
  callAndSubscribe<M extends ApiCallAndSubscribeMethod>(
    method: M,
    params?: ApiCallParams<M>,
  ): Observable<ApiCallAndSubscribeResponse<M>[]> {
    return this.callMethod<M>(method, params)
      .pipe(
        switchMap((items) => this.subscribe(method).pipe(
          startWith(null),
          map((event) => ([items, event])),
        )),
        applyApiEvent(),
        takeUntil(this.clearSubscriptions$),
      );
  }

  /**
   * Use `job` when you care about job progress or result.
   */
  startJob<M extends ApiJobMethod>(method: M, params?: ApiJobParams<M>): Observable<number> {
    return this.callMethod(method, params);
  }

  /**
   * In your subscription, next will be next job update, complete will be when the job is complete.
   */
  job<M extends ApiJobMethod>(
    method: M,
    params?: ApiJobParams<M>,
  ): Observable<Job<ApiJobResponse<M>>> {
    return this.callMethod(method, params).pipe(
      switchMap((jobId: number) => {
        return merge(
          this.subscribeToJobUpdates(jobId),
          // Get job status here for jobs that complete too fast.
          this.call('core.get_jobs', [[['id', '=', jobId]]]).pipe(map((jobs) => jobs[0])),
        )
          .pipe(observeJob());
      }),
      takeUntil(this.clearSubscriptions$),
    ) as Observable<Job<ApiJobResponse<M>>>;
  }

  subscribe<K extends ApiEventMethod = ApiEventMethod>(method: K): Observable<ApiEventTyped<K>> {
    if (this.eventSubscribers.has(method)) {
      return this.eventSubscribers.get(method);
    }
    const observable$ = new Observable((trigger: Subscriber<ApiEventTyped<K>>) => {
      const subscription = this.wsManager.buildSubscriber<K, ApiEventTyped<K>>(method).subscribe(trigger);
      return () => {
        subscription.unsubscribe();
        this.eventSubscribers.delete(method);
      };
    }).pipe(
      switchMap((apiEvent) => {
        const erroredEvent = apiEvent as unknown as ResultMessage;
        if (erroredEvent?.error) {
          console.error('Error: ', erroredEvent.error);
          return throwError(() => erroredEvent.error);
        }
        return of(apiEvent);
      }),
      share(),
      takeUntil(this.clearSubscriptions$),
    );

    this.eventSubscribers.set(method, observable$);
    return observable$;
  }

  subscribeToLogs(name: string): Observable<ApiEvent<{ data: string }>> {
    return this.subscribe(name as ApiEventMethod) as unknown as Observable<ApiEvent<{ data: string }>>;
  }

  clearSubscriptions(): void {
    this.clearSubscriptions$.next();
    this.eventSubscribers.clear();
  }

  private callMethod<M extends ApiCallMethod>(method: M, params?: ApiCallParams<M>): Observable<ApiCallResponse<M>>;
  private callMethod<M extends ApiJobMethod>(method: M, params?: ApiJobParams<M>): Observable<number>;
  private callMethod<M extends ApiCallMethod | ApiJobMethod>(method: M, params?: unknown): Observable<unknown> {
    const uuid = UUID.UUID();
    return of(uuid).pipe(
      tap(() => {
        this.wsManager.send({
          id: uuid, msg: IncomingApiMessageType.Method, method, params,
        });
      }),
      switchMap(() => this.ws$),
      filter((data: IncomingWebSocketMessage) => data.msg === IncomingApiMessageType.Result && data.id === uuid),
      switchMap((data: IncomingWebSocketMessage) => {
        if ('error' in data && data.error) {
          this.printError(data.error, { method, params });
          const error = this.enhanceError(data.error, { method });
          return throwError(() => error);
        }

        return of(data);
      }),

      map((data: ResultMessage) => data.result),
      take(1),
    );
  }

  private subscribeToJobUpdates(jobId: number): Observable<Job> {
    return this.subscribe('core.get_jobs').pipe(
      filter((apiEvent) => apiEvent.id === jobId),
      map((apiEvent) => apiEvent.fields),
      takeUntil(this.clearSubscriptions$),
    );
  }

  private printError(error: WebSocketError, context: { method: string; params: unknown }): void {
    if (error.errname === WebSocketErrorName.NoAccess) {
      console.error(`Access denied to ${context.method} with ${context.params ? JSON.stringify(context.params) : 'no params'}`);
      return;
    }

    // Do not log validation errors.
    if (error.type === ResponseErrorType.Validation) {
      return;
    }

    console.error('Error: ', error);
  }

  // TODO: Probably doesn't belong here. Consider building something similar to interceptors.
  private enhanceError(error: WebSocketError, context: { method: string }): WebSocketError {
    if (error.errname === WebSocketErrorName.NoAccess) {
      return {
        ...error,
        reason: this.translate.instant('Access denied to {method}', { method: context.method }),
      };
    }

    return error;
  }
}
