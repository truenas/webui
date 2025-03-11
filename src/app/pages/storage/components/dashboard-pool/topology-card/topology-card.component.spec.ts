import { ReactiveFormsModule } from '@angular/forms';
import { createComponentFactory, Spectator } from '@ngneat/spectator/jest';
import { MockComponent } from 'ng-mocks';
import { GiB } from 'app/constants/bytes.constant';
import { mockApi } from 'app/core/testing/utils/mock-api.utils';
import { PoolCardIconType } from 'app/enums/pool-card-icon-type.enum';
import { PoolStatus } from 'app/enums/pool-status.enum';
import { Disk } from 'app/interfaces/disk.interface';
import { Pool } from 'app/interfaces/pool.interface';
import { TopologyDisk, TopologyItem } from 'app/interfaces/storage.interface';
import {
  PoolCardIconComponent,
} from 'app/pages/storage/components/dashboard-pool/pool-card-icon/pool-card-icon.component';
import {
  diskToDashboardDisk,
} from 'app/pages/storage/components/dashboard-pool/topology-card/mock-storage-dashboard.utils';
import {
  TopologyCardComponent,
} from 'app/pages/storage/components/dashboard-pool/topology-card/topology-card.component';

describe('TopologyCardComponent', () => {
  let spectator: Spectator<TopologyCardComponent>;

  const createComponent = createComponentFactory({
    component: TopologyCardComponent,
    imports: [
      ReactiveFormsModule,
    ],
    declarations: [
      MockComponent(PoolCardIconComponent),
    ],
    providers: [
      mockApi([]),
    ],
  });

  describe('tests with Mixed Capacity', () => {
    beforeEach(() => {
      const mockDisks = [
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f0',
          name: 'sda',
          serial: '1234567890abcd0',
          size: 6597069766656,
          devname: 'sda',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f1',
          name: 'sdb',
          serial: '1234567890abcd1',
          size: 6597069766656,
          devname: 'sdb',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f2',
          name: 'sdc',
          serial: '1234567890abcd2',
          size: 6597069766656,
          devname: 'sdc',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f3',
          name: 'sdd',
          serial: '1234567890abcd3',
          size: 6597069766656,
          devname: 'sdd',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f4',
          name: 'sde',
          serial: '1234567890abcd4',
          size: 6597069766656,
          devname: 'sde',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f5',
          name: 'sdf',
          serial: '1234567890abcd5',
          size: 6597069766656,
          devname: 'sdf',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f6',
          name: 'sdg',
          serial: '1234567890abcd6',
          size: 6597069766656,
          devname: 'sdg',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f7',
          name: 'sdh',
          serial: '1234567890abcd7',
          size: 4398046511104,
          devname: 'sdh',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f8',
          name: 'sdi',
          serial: '1234567890abcd8',
          size: 4398046511104,
          devname: 'sdi',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f9',
          name: 'sdj',
          serial: '1234567890abcd9',
          size: 4398046511104,
          devname: 'sdj',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f10',
          name: 'sdk',
          serial: '1234567890abcd10',
          size: 4398046511104,
          devname: 'sdk',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f11',
          name: 'sdl',
          serial: '1234567890abcd11',
          size: 4398046511104,
          devname: 'sdl',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f12',
          name: 'sdm',
          serial: '1234567890abcd12',
          size: 4398046511104,
          devname: 'sdm',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f13',
          name: 'sdn',
          serial: '1234567890abcd13',
          size: 4398046511104,
          devname: 'sdn',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f14',
          name: 'sdo',
          serial: '1234567890abcd14',
          size: 5497558138880,
          devname: 'sdo',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f15',
          name: 'sdp',
          serial: '1234567890abcd15',
          size: 4398046511104,
          devname: 'sdp',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f16',
          name: 'sdq',
          serial: '1234567890abcd16',
          size: 4398046511104,
          devname: 'sdq',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f17',
          name: 'sdr',
          serial: '1234567890abcd17',
          size: 4398046511104,
          devname: 'sdr',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f18',
          name: 'sds',
          serial: '1234567890abcd18',
          size: 4398046511104,
          devname: 'sds',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f19',
          name: 'sdt',
          serial: '1234567890abcd19',
          size: 4398046511104,
          devname: 'sdt',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f20',
          name: 'sdu',
          serial: '1234567890abcd20',
          size: 4398046511104,
          devname: 'sdu',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f21',
          name: 'sdv',
          serial: '1234567890abcd21',
          size: 4398046511104,
          devname: 'sdv',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f22',
          name: 'sdw',
          serial: '1234567890abcd22',
          size: 5497558138880,
          devname: 'sdw',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f23',
          name: 'sdx',
          serial: '1234567890abcd23',
          size: 4398046511104,
          devname: 'sdx',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f24',
          name: 'sdy',
          serial: '1234567890abcd24',
          size: 4398046511104,
          devname: 'sdy',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f25',
          name: 'sdz',
          serial: '1234567890abcd25',
          size: 4398046511104,
          devname: 'sdz',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f26',
          name: 'sdaa',
          serial: '1234567890abcd26',
          size: 4398046511104,
          devname: 'sdaa',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f27',
          name: 'sdab',
          serial: '1234567890abcd27',
          size: 4398046511104,
          devname: 'sdab',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f28',
          name: 'sdac',
          serial: '1234567890abcd28',
          size: 4398046511104,
          devname: 'sdac',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f29',
          name: 'sdad',
          serial: '1234567890abcd29',
          size: 4398046511104,
          devname: 'sdad',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f30',
          name: 'sdae',
          serial: '1234567890abcd30',
          size: 5497558138880,
          devname: 'sdae',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f31',
          name: 'sdaf',
          serial: '1234567890abcd31',
          size: 4398046511104,
          devname: 'sdaf',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f32',
          name: 'sdag',
          serial: '1234567890abcd32',
          size: 4398046511104,
          devname: 'sdag',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f33',
          name: 'sdah',
          serial: '1234567890abcd33',
          size: 4398046511104,
          devname: 'sdah',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f34',
          name: 'sdai',
          serial: '1234567890abcd34',
          size: 4398046511104,
          devname: 'sdai',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f35',
          name: 'sdaj',
          serial: '1234567890abcd35',
          size: 4398046511104,
          devname: 'sdaj',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f36',
          name: 'sdak',
          serial: '1234567890abcd36',
          size: 4398046511104,
          devname: 'sdak',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f37',
          name: 'sdal',
          serial: '1234567890abcd37',
          size: 4398046511104,
          devname: 'sdal',
        },
      ] as Disk[];

      const mockPoolState: Pool = {
        id: 1,
        name: 'MOCK_POOL',
        healthy: true,
        status: 'ONLINE',
        topology: {
          data: [
            {
              type: 'RAIDZ3',
              children: [
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sda',
                  stats: {
                    size: 6597069766656,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sda2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdb',
                  stats: {
                    size: 6597069766656,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdb2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdc',
                  stats: {
                    size: 6597069766656,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdc2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdd',
                  stats: {
                    size: 6597069766656,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdd2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sde',
                  stats: {
                    size: 6597069766656,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sde2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdf',
                  stats: {
                    size: 6597069766656,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdf2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdg',
                  stats: {
                    size: 6597069766656,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdg2',
                  guid: '12345',
                },
              ] as TopologyDisk[],
              guid: '12345',
              stats: {
                size: 26388279066624,
              },
              status: 'ONLINE',
              name: 'RAIDZ3-0',
            },
            {
              type: 'RAIDZ3',
              children: [
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdh',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdh2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdi',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdi2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdj',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdj2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdk',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdk2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdl',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdl2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdm',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdm2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdn',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdn2',
                  guid: '12345',
                },
              ],
              guid: '12345',
              stats: {
                size: 17592186044416,
              },
              status: 'ONLINE',
              name: 'RAIDZ3-1',
            },
          ],
          special: [
            {
              type: 'RAIDZ2',
              children: [
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdo',
                  stats: {
                    size: 5497558138880,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdo2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdp',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdp2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdq',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdq2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdr',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdr2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sds',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sds2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdt',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdt2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdu',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdu2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdv',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdv2',
                  guid: '12345',
                },
              ],
              guid: '12345',
              stats: {
                size: 26388279066624,
              },
              status: 'ONLINE',
              name: 'RAIDZ2-0',
            },
            {
              type: 'RAIDZ2',
              children: [
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdw',
                  stats: {
                    size: 5497558138880,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdw2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdx',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdx2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdy',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdy2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdz',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdz2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdaa',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdaa2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdab',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdab2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdac',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdac2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdad',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdad2',
                  guid: '12345',
                },
              ],
              guid: '12345',
              stats: {
                size: 26388279066624,
              },
              status: 'ONLINE',
              name: 'RAIDZ2-1',
            },
            {
              type: 'RAIDZ2',
              children: [
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdae',
                  stats: {
                    size: 5497558138880,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdae2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdaf',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdaf2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdag',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdag2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdah',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdah2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdai',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdai2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdaj',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdaj2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdak',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdak2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdal',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdal2',
                  guid: '12345',
                },
              ],
              guid: '12345',
              stats: {
                size: 26388279066624,
              },
              status: 'ONLINE',
              name: 'RAIDZ2-2',
            },
          ],
          log: [] as TopologyItem[],
          spare: [] as TopologyItem[],
          cache: [] as TopologyItem[],
          dedup: [] as TopologyItem[],
        },
        autotrim: {
          value: 'off',
        },
      } as Pool;

      spectator = createComponent({
        props: {
          poolState: mockPoolState,
          disks: mockDisks.map((disk: Disk) => diskToDashboardDisk(disk)),
        },
      });
    });

    it('rendering VDEVs rows', () => {
      const captions = spectator.queryAll('.vdev-line b');
      const values = spectator.queryAll('.vdev-line .vdev-value');
      expect(spectator.queryAll('.vdev-line .warning ix-icon')).toHaveLength(2);

      expect(captions[0]).toHaveText('Data VDEVs');
      expect(captions[1]).toHaveText('Metadata');
      expect(values[0]).toHaveText('2 x RAIDZ3 | 7 wide | Mixed Capacity');
      expect(values[1]).toHaveText('3 x RAIDZ2 | 8 wide | Mixed Capacity');
    });
  });

  describe('tests without Mixed Capacity', () => {
    beforeEach(() => {
      const mockDisks = [
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f0',
          name: 'sda',
          serial: '1234567890abcd0',
          size: 4398046511104,
          devname: 'sda',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f1',
          name: 'sdb',
          serial: '1234567890abcd1',
          size: 4398046511104,
          devname: 'sdb',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f2',
          name: 'sdc',
          serial: '1234567890abcd2',
          size: 4398046511104,
          devname: 'sdc',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f3',
          name: 'sdd',
          serial: '1234567890abcd3',
          size: 4398046511104,
          devname: 'sdd',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f4',
          name: 'sde',
          serial: '1234567890abcd4',
          size: 4398046511104,
          devname: 'sde',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f5',
          name: 'sdf',
          serial: '1234567890abcd5',
          size: 4398046511104,
          devname: 'sdf',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f6',
          name: 'sdg',
          serial: '1234567890abcd6',
          size: 4398046511104,
          devname: 'sdg',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f7',
          name: 'sdh',
          serial: '1234567890abcd7',
          size: 4398046511104,
          devname: 'sdh',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f8',
          name: 'sdi',
          serial: '1234567890abcd8',
          size: 4398046511104,
          devname: 'sdi',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f9',
          name: 'sdj',
          serial: '1234567890abcd9',
          size: 4398046511104,
          devname: 'sdj',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f10',
          name: 'sdk',
          serial: '1234567890abcd10',
          size: 4398046511104,
          devname: 'sdk',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f11',
          name: 'sdl',
          serial: '1234567890abcd11',
          size: 4398046511104,
          devname: 'sdl',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f12',
          name: 'sdm',
          serial: '1234567890abcd12',
          size: 4398046511104,
          devname: 'sdm',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f13',
          name: 'sdn',
          serial: '1234567890abcd13',
          size: 4398046511104,
          devname: 'sdn',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f14',
          name: 'sdo',
          serial: '1234567890abcd14',
          size: 4398046511104,
          devname: 'sdo',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f15',
          name: 'sdp',
          serial: '1234567890abcd15',
          size: 4398046511104,
          devname: 'sdp',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f16',
          name: 'sdq',
          serial: '1234567890abcd16',
          size: 4398046511104,
          devname: 'sdq',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f17',
          name: 'sdr',
          serial: '1234567890abcd17',
          size: 2199023255552,
          devname: 'sdr',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f18',
          name: 'sds',
          serial: '1234567890abcd18',
          size: 2199023255552,
          devname: 'sds',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f19',
          name: 'sdt',
          serial: '1234567890abcd19',
          size: 2199023255552,
          devname: 'sdt',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f20',
          name: 'sdu',
          serial: '1234567890abcd20',
          size: 2199023255552,
          devname: 'sdu',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f21',
          name: 'sdv',
          serial: '1234567890abcd21',
          size: 2199023255552,
          devname: 'sdv',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f22',
          name: 'sdw',
          serial: '1234567890abcd22',
          size: 2199023255552,
          devname: 'sdw',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f23',
          name: 'sdx',
          serial: '1234567890abcd23',
          size: 8796093022208,
          devname: 'sdx',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f24',
          name: 'sdy',
          serial: '1234567890abcd24',
          size: 8796093022208,
          devname: 'sdy',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f25',
          name: 'sdz',
          serial: '1234567890abcd25',
          size: 8796093022208,
          devname: 'sdz',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f26',
          name: 'sdaa',
          serial: '1234567890abcd26',
          size: 4398046511104,
          devname: 'sdaa',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f27',
          name: 'sdab',
          serial: '1234567890abcd27',
          size: 4398046511104,
          devname: 'sdab',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f28',
          name: 'sdac',
          serial: '1234567890abcd28',
          size: 4398046511104,
          devname: 'sdac',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f29',
          name: 'sdad',
          serial: '1234567890abcd29',
          size: 4398046511104,
          devname: 'sdad',
        },
      ] as Disk[];

      const mockPoolState = {
        id: 1,
        name: 'MOCK_POOL',
        healthy: true,
        status: 'ONLINE',
        topology: {
          data: [
            {
              type: 'RAIDZ3',
              children: [
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sda',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sda2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdb',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdb2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdc',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdc2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdd',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdd2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sde',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sde2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdf',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdf2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdg',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdg2',
                  guid: '12345',
                },
              ],
              guid: '12345',
              stats: {
                size: 17592186044416,
              },
              status: 'ONLINE',
              name: 'RAIDZ3-0',
            },
            {
              type: 'RAIDZ3',
              children: [
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdh',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdh2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdi',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdi2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdj',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdj2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdk',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdk2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdl',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdl2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdm',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdm2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdn',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdn2',
                  guid: '12345',
                },
              ],
              guid: '12345',
              stats: {
                size: 17592186044416,
              },
              status: 'ONLINE',
              name: 'RAIDZ3-1',
            },
          ],
          special: [
            {
              type: 'MIRROR',
              children: [
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdo',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdo2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdp',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdp2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdq',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdq2',
                  guid: '12345',
                },
              ],
              guid: '12345',
              stats: {
                size: 4398046511104,
              },
              status: 'ONLINE',
              name: 'MIRROR-0',
            },
          ],
          log: [
            {
              type: 'MIRROR',
              children: [
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdr',
                  stats: {
                    size: 2199023255552,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdr2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sds',
                  stats: {
                    size: 2199023255552,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sds2',
                  guid: '12345',
                },
              ],
              guid: '12345',
              stats: {
                size: 2199023255552,
              },
              status: 'ONLINE',
              name: 'MIRROR-0',
            },
            {
              type: 'MIRROR',
              children: [
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdt',
                  stats: {
                    size: 2199023255552,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdt2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdu',
                  stats: {
                    size: 2199023255552,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdu2',
                  guid: '12345',
                },
              ],
              guid: '12345',
              stats: {
                size: 2199023255552,
              },
              status: 'ONLINE',
              name: 'MIRROR-1',
            },
          ],
          spare: [
            {
              type: 'DISK',
              status: 'ONLINE',
              children: [] as TopologyDisk[],
              disk: 'sdx',
              stats: {
                size: 2 * GiB,
              },
              guid: '12345',
            },
            {
              type: 'DISK',
              status: 'ONLINE',
              children: [] as TopologyDisk[],
              disk: 'sdy',
              stats: {
                size: 2 * GiB,
              },
              guid: '12345',
            },
            {
              type: 'DISK',
              status: 'ONLINE',
              children: [] as TopologyDisk[],
              disk: 'sdz',
              stats: {
                size: 2 * GiB,
              },
              guid: '12345',
            },
          ] as TopologyItem[],
          cache: [
            {
              type: 'DISK',
              status: 'ONLINE',
              children: [] as TopologyDisk[],
              disk: 'sdv',
              stats: {
                size: 2 * GiB,
              },
              guid: '12345',
            },
            {
              type: 'DISK',
              status: 'ONLINE',
              children: [] as TopologyDisk[],
              disk: 'sdw',
              stats: {
                size: 2 * GiB,
              },
              guid: '12345',
            },
          ] as TopologyItem[],
          dedup: [
            {
              type: 'DISK',
              status: 'ONLINE',
              children: [] as TopologyDisk[],
              disk: 'sdaa',
              stats: {
                size: 2 * GiB,
              },
              guid: '12345',
            },
            {
              type: 'DISK',
              status: 'ONLINE',
              children: [] as TopologyDisk[],
              disk: 'sdab',
              stats: {
                size: 2 * GiB,
              },
              guid: '12345',
            },
            {
              type: 'DISK',
              status: 'ONLINE',
              children: [] as TopologyDisk[],
              disk: 'sdac',
              stats: {
                size: 2 * GiB,
              },
              guid: '12345',
            },
            {
              type: 'DISK',
              status: 'ONLINE',
              children: [] as TopologyDisk[],
              disk: 'sdad',
              stats: {
                size: 2 * GiB,
              },
              guid: '12345',
            },
          ] as TopologyItem[],
        },
        autotrim: {
          value: 'off',
        },
      } as Pool;
      spectator = createComponent({
        props: {
          poolState: mockPoolState,
          disks: mockDisks.map((disk: Disk) => diskToDashboardDisk(disk)),
        },
      });
    });

    it('rendering VDEVs rows', () => {
      const captions = spectator.queryAll('.vdev-line b');
      const values = spectator.queryAll('.vdev-line .vdev-value');
      expect(spectator.queryAll('.vdev-line .warning .ix-icon')).toHaveLength(1);
      expect(captions).toHaveLength(6);
      expect(values).toHaveLength(6);

      expect(captions[0]).toHaveText('Data VDEVs');
      expect(values[0]).toHaveText('2 x RAIDZ3 | 7 wide | 4 TiB');

      // Can be Disk or MIRROR
      expect(captions[2]).toHaveText('Log VDEVs');
      expect(values[2]).toHaveText('2 x MIRROR | 2 wide | 2 TiB');

      // Can be DISK Only
      expect(captions[3]).toHaveText('Cache VDEVs');
      expect(values[3]).toHaveText('2 x 2 TiB');

      // Can be DISK only but should also be same size or larger than disk sizes used in data VDEVs
      expect(captions[4]).toHaveText('Spare VDEVs');
      expect(values[4]).toHaveText('3 x 8 TiB');

      // Redundancy level should match data VDEVs
      expect(captions[1]).toHaveText('Metadata');
      expect(values[1]).toHaveText('1 x MIRROR | 3 wide | 4 TiB');
      expect(captions[5]).toHaveText('Dedup VDEVs');
      expect(values[5]).toHaveText('4 x DISK | 1 wide | 4 TiB');
    });

    it('rendering status icon', () => {
      expect(spectator.query(PoolCardIconComponent)!.type).toBe(PoolCardIconType.Safe);
      expect(spectator.query(PoolCardIconComponent)!.tooltip).toBe('Everything is fine');

      spectator.setInput('poolState', { healthy: false, status: PoolStatus.Online } as Pool);
      expect(spectator.query(PoolCardIconComponent)!.type).toBe(PoolCardIconType.Warn);
      expect(spectator.query(PoolCardIconComponent)!.tooltip).toBe('Pool is not healthy');

      spectator.setInput('poolState', { healthy: true, status: PoolStatus.Offline } as Pool);
      expect(spectator.query(PoolCardIconComponent)!.type).toBe(PoolCardIconType.Warn);
      expect(spectator.query(PoolCardIconComponent)!.tooltip).toBe('Pool contains OFFLINE Data VDEVs');

      spectator.setInput('poolState', { healthy: true, status: PoolStatus.Removed } as Pool);
      expect(spectator.query(PoolCardIconComponent)!.type).toBe(PoolCardIconType.Error);
      expect(spectator.query(PoolCardIconComponent)!.tooltip).toBe('Pool contains REMOVED Data VDEVs');

      spectator.setInput('poolState', { healthy: true, status: PoolStatus.Faulted } as Pool);
      expect(spectator.query(PoolCardIconComponent)!.type).toBe(PoolCardIconType.Error);
      expect(spectator.query(PoolCardIconComponent)!.tooltip).toBe('Pool contains FAULTED Data VDEVs');
    });
  });

  describe('tests with offline pools', () => {
    beforeEach(() => {
      const mockPoolState = {
        id: 1,
        name: 'MOCK_POOL',
        healthy: true,
        status: 'ONLINE',
        topology: {
          data: [
            {
              type: 'RAIDZ3',
              children: [
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sda',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sda2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdb',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdb2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdc',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdc2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdd',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdd2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sde',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sde2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdf',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdf2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdg',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdg2',
                  guid: '12345',
                },
              ],
              guid: '12345',
              stats: {
                size: 17592186044416,
              },
              status: 'ONLINE',
              name: 'RAIDZ3-0',
            },
            {
              type: 'RAIDZ3',
              children: [
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdh',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdh2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdi',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdi2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdj',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdj2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdk',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdk2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdl',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdl2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdm',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdm2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdn',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdn2',
                  guid: '12345',
                },
              ],
              guid: '12345',
              stats: {
                size: 17592186044416,
              },
              status: 'ONLINE',
              name: 'RAIDZ3-1',
            },
          ],
          special: [
            {
              type: 'MIRROR',
              children: [
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdo',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdo2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdp',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdp2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdq',
                  stats: {
                    size: 4398046511104,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdq2',
                  guid: '12345',
                },
              ],
              guid: '12345',
              stats: {
                size: 4398046511104,
              },
              status: 'ONLINE',
              name: 'MIRROR-0',
            },
          ],
          log: [
            {
              type: 'MIRROR',
              children: [
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdr',
                  stats: {
                    size: 2199023255552,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdr2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sds',
                  stats: {
                    size: 2199023255552,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sds2',
                  guid: '12345',
                },
              ],
              guid: '12345',
              stats: {
                size: 2199023255552,
              },
              status: 'ONLINE',
              name: 'MIRROR-0',
            },
            {
              type: 'MIRROR',
              children: [
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdt',
                  stats: {
                    size: 2199023255552,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdt2',
                  guid: '12345',
                },
                {
                  type: 'DISK',
                  status: 'ONLINE',
                  children: [] as TopologyDisk[],
                  disk: 'sdu',
                  stats: {
                    size: 2199023255552,
                    timestamp: 164848882662718,
                    read_errors: 0,
                    write_errors: 0,
                    checksum_errors: 0,
                  },
                  device: 'sdu2',
                  guid: '12345',
                },
              ],
              guid: '12345',
              stats: {
                size: 2199023255552,
              },
              status: 'ONLINE',
              name: 'MIRROR-1',
            },
          ],
          spare: [
            {
              type: 'DISK',
              status: 'ONLINE',
              children: [] as TopologyDisk[],
              disk: 'sdx',
              stats: {
                size: 2 * GiB,
              },
              guid: '12345',
            },
            {
              type: 'DISK',
              status: 'ONLINE',
              children: [] as TopologyDisk[],
              disk: 'sdy',
              stats: {
                size: 2 * GiB,
              },
              guid: '12345',
            },
            {
              type: 'DISK',
              status: 'ONLINE',
              children: [] as TopologyDisk[],
              disk: 'sdz',
              stats: {
                size: 2 * GiB,
              },
              guid: '12345',
            },
          ],
          cache: [
            {
              type: 'DISK',
              status: 'ONLINE',
              children: [] as TopologyDisk[],
              disk: 'sdv',
              stats: {
                size: 2 * GiB,
              },
              guid: '12345',
            },
            {
              type: 'DISK',
              status: 'ONLINE',
              children: [] as TopologyDisk[],
              disk: 'sdw',
              stats: {
                size: 2 * GiB,
              },
              guid: '12345',
            },
          ],
          dedup: [] as TopologyItem[],
        },
        autotrim: {
          value: 'off',
        },
      } as Pool;

      const mockDisks = [
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f0',
          name: 'sda',
          serial: '1234567890abcd0',
          size: 4398046511104,
          devname: 'sda',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f1',
          name: 'sdb',
          serial: '1234567890abcd1',
          size: 4398046511104,
          devname: 'sdb',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f2',
          name: 'sdc',
          serial: '1234567890abcd2',
          size: 4398046511104,
          devname: 'sdc',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f3',
          name: 'sdd',
          serial: '1234567890abcd3',
          size: 4398046511104,
          devname: 'sdd',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f4',
          name: 'sde',
          serial: '1234567890abcd4',
          size: 4398046511104,
          devname: 'sde',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f5',
          name: 'sdf',
          serial: '1234567890abcd5',
          size: 4398046511104,
          devname: 'sdf',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f6',
          name: 'sdg',
          serial: '1234567890abcd6',
          size: 4398046511104,
          devname: 'sdg',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f7',
          name: 'sdh',
          serial: '1234567890abcd7',
          size: 4398046511104,
          devname: 'sdh',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f8',
          name: 'sdi',
          serial: '1234567890abcd8',
          size: 4398046511104,
          devname: 'sdi',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f9',
          name: 'sdj',
          serial: '1234567890abcd9',
          size: 4398046511104,
          devname: 'sdj',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f10',
          name: 'sdk',
          serial: '1234567890abcd10',
          size: 4398046511104,
          devname: 'sdk',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f11',
          name: 'sdl',
          serial: '1234567890abcd11',
          size: 4398046511104,
          devname: 'sdl',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f12',
          name: 'sdm',
          serial: '1234567890abcd12',
          size: 4398046511104,
          devname: 'sdm',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f13',
          name: 'sdn',
          serial: '1234567890abcd13',
          size: 4398046511104,
          devname: 'sdn',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f14',
          name: 'sdo',
          serial: '1234567890abcd14',
          size: 4398046511104,
          devname: 'sdo',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f15',
          name: 'sdp',
          serial: '1234567890abcd15',
          size: 4398046511104,
          devname: 'sdp',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f16',
          name: 'sdq',
          serial: '1234567890abcd16',
          size: 4398046511104,
          devname: 'sdq',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f17',
          name: 'sdr',
          serial: '1234567890abcd17',
          size: 2199023255552,
          devname: 'sdr',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f18',
          name: 'sds',
          serial: '1234567890abcd18',
          size: 2199023255552,
          devname: 'sds',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f19',
          name: 'sdt',
          serial: '1234567890abcd19',
          size: 2199023255552,
          devname: 'sdt',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f20',
          name: 'sdu',
          serial: '1234567890abcd20',
          size: 2199023255552,
          devname: 'sdu',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f21',
          name: 'sdv',
          serial: '1234567890abcd21',
          size: 2199023255552,
          devname: 'sdv',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f22',
          name: 'sdw',
          serial: '1234567890abcd22',
          size: 2199023255552,
          devname: 'sdw',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f23',
          name: 'sdx',
          serial: '1234567890abcd23',
          size: 8796093022208,
          devname: 'sdx',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f24',
          name: 'sdy',
          serial: '1234567890abcd24',
          size: 8796093022208,
          devname: 'sdy',
        },
        {
          identifier: '{uuid}d5433b0f-180b-4706-afd0-476915e8925f25',
          name: 'sdz',
          serial: '1234567890abcd25',
          size: 8796093022208,
          devname: 'sdz',
        },
      ] as Disk[];

      spectator = createComponent({
        props: {
          poolState: { ...mockPoolState, status: PoolStatus.Offline },
          disks: mockDisks.map((disk: Disk) => diskToDashboardDisk(disk)),
        },
      });
    });
    it('rendering VDEVs rows', () => {
      const captions = spectator.queryAll('.vdev-line b');
      const values = spectator.queryAll('.vdev-line .vdev-value');

      expect(spectator.queryAll('.vdev-line .warning ix-icon')).toHaveLength(1);
      expect(captions).toHaveLength(6);
      expect(values).toHaveLength(5);

      expect(captions[0]).toHaveText('Data VDEVs');
      expect(spectator.query('.offline-data-vdevs')!.textContent).toBe('Offline VDEVs');

      // Redundancy level should match data VDEVs
      expect(captions[1]).toHaveText('Metadata');
      expect(values[0]).toHaveText('N/A');

      // Can be Disk or MIRROR
      expect(captions[2]).toHaveText('Log VDEVs');
      expect(values[1]).toHaveText('N/A');

      // Can be DISK Only
      expect(captions[3]).toHaveText('Cache VDEVs');
      expect(values[2]).toHaveText('N/A');

      // Can be DISK only but should also be same size or larger than disk sizes used in data VDEVs
      expect(captions[4]).toHaveText('Spare VDEVs');
      expect(values[3]).toHaveText('N/A');

      expect(captions[5]).toHaveText('Dedup VDEVs');
      expect(values[4]).toHaveText('N/A');
    });
  });
});
