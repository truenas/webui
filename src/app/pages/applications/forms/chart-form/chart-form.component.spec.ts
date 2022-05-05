import { EventEmitter } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { ChartFormComponent } from 'app/pages/applications/forms/chart-form/chart-form.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('ChartFormComponent', () => {
  let spectator: Spectator<ChartFormComponent>;

  const mockDialogRef = {
    componentInstance: {
      setDescription: jest.fn(),
      setCall: jest.fn(),
      submit: jest.fn(),
      success: new EventEmitter(),
      failure: new EventEmitter(),
    },
    close: jest.fn(),
  } as unknown as MatDialogRef<EntityJobComponent>;

  const existingChartCreate = {
    name: 'ipfs',
    categories: [
      'storage',
    ],
    app_readme: '<p><a href="https://ipfs.io">IPFS</a> is a global, versioned, peer-to-peer filesystem. It combines good ideas from previous systems such Git, BitTorrent, Kademlia, SFS, and the Web. It is like a single bittorrent swarm, exchanging git objects. IPFS provides an interface as simple as the HTTP web, but with permanence built in. You can also mount the world at /ipfs.</p>',
    location: '/mnt/my pool/ix-applications/catalogs/github_com_truenas_charts_git_master/charts/ipfs',
    healthy: true,
    healthy_error: null,
    versions: {
      '1.2.1': {
        healthy: true,
        supported: true,
        healthy_error: null,
        location: '/mnt/my pool/ix-applications/catalogs/github_com_truenas_charts_git_master/charts/ipfs/1.2.1',
        required_features: [
          'normalize/ixVolume',
        ],
        human_version: 'v0.12.2_1.2.1',
        version: '1.2.1',
        chart_metadata: {
          apiVersion: 'v1',
          appVersion: 'v0.12.2',
          dependencies: [
            {
              name: 'common',
              repository: 'file://../../../library/common/2112.0.0',
              version: '2112.0.0',
            },
          ],
          description: 'Global, Versioned, peer-to-peer filesystem.',
          home: 'https://ipfs.io',
          icon: 'https://ipfs.io/ipfs/QmVk7srrwahXLNmcDYvyUEJptyoxpndnRa57YJ11L4jV26/ipfs.go.png',
          keywords: [
            'storage',
            'p2p',
          ],
          name: 'ipfs',
          sources: [
            'https://github.com/ipfs/go-ipfs',
            'https://hub.docker.com/r/ipfs/go-ipfs',
          ],
          upstream_version: '0.8.0-rc1',
          version: '1.2.1',
        },
        schema: {
          groups: [
            {
              name: 'Container Images',
              description: 'Image to be used for container',
            },
            {
              name: 'Workload Configuration',
              description: 'Configure Storage for IPFS',
            },
            {
              name: 'Storage',
              description: 'Configure Storage for IPFS',
            },
            {
              name: 'IPFS Configuration',
              description: 'Configure Storage for IPFS',
            },
            {
              name: 'Advanced DNS Settings',
              description: 'Configure DNS settings',
            },
          ],
          portals: {
            web_portal: {
              protocols: [
                'http',
              ],
              host: [
                '$node_ip',
              ],
              ports: [
                '$variable-service.apiPort',
              ],
              path: '/webui',
            },
          },
          questions: [
            {
              variable: 'dnsConfig',
              label: 'DNS Configuration',
              group: 'Advanced DNS Settings',
              schema: {
                type: 'dict',
                attrs: [
                  {
                    variable: 'options',
                    label: 'DNS Options',
                    schema: {
                      type: 'list',
                      items: [
                        {
                          variable: 'optionsEntry',
                          label: 'Option Entry Configuration',
                          schema: {
                            type: 'dict',
                            attrs: [
                              {
                                variable: 'name',
                                label: 'Option Name',
                                schema: {
                                  type: 'string',
                                  required: true,
                                },
                              },
                              {
                                variable: 'value',
                                label: 'Option Value',
                                schema: {
                                  type: 'string',
                                  required: true,
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              variable: 'updateStrategy',
              label: 'IPFS update strategy',
              group: 'Workload Configuration',
              schema: {
                type: 'string',
                default: 'Recreate',
                enum: [
                  {
                    value: 'RollingUpdate',
                    description: 'Create new pods and then kill old ones',
                  },
                  {
                    value: 'Recreate',
                    description: 'Kill existing pods before creating new ones',
                  },
                ],
              },
            },
            {
              variable: 'environmentVariables',
              label: 'IPFS image environment',
              group: 'IPFS Configuration',
              schema: {
                type: 'list',
                default: [],
                items: [
                  {
                    variable: 'environmentVariable',
                    label: 'Environment Variable',
                    schema: {
                      type: 'dict',
                      attrs: [
                        {
                          variable: 'name',
                          label: 'Name',
                          schema: {
                            type: 'string',
                          },
                        },
                        {
                          variable: 'value',
                          label: 'Value',
                          schema: {
                            type: 'string',
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            {
              variable: 'service',
              description: 'IPFS Service Configuration',
              label: 'IPFS Service Configuration',
              group: 'IPFS Configuration',
              schema: {
                type: 'dict',
                required: true,
                attrs: [
                  {
                    variable: 'swarmPort',
                    label: 'Swarm Port to use for IPFS (Public)',
                    schema: {
                      type: 'int',
                      min: 9000,
                      max: 65535,
                      default: 9401,
                      required: true,
                    },
                  },
                  {
                    variable: 'apiPort',
                    label: 'API Port to use for IPFS (local)',
                    schema: {
                      type: 'int',
                      min: 9000,
                      max: 65535,
                      default: 9501,
                      required: true,
                    },
                  },
                  {
                    variable: 'gatewayPort',
                    label: 'Gateway Port to use for IPFS (local)',
                    schema: {
                      type: 'int',
                      min: 9000,
                      max: 65535,
                      default: 9880,
                      required: true,
                    },
                  },
                ],
              },
            },
            {
              variable: 'appVolumeMounts',
              label: 'IPFS Storage',
              group: 'Storage',
              schema: {
                type: 'dict',
                attrs: [
                  {
                    variable: 'staging',
                    label: 'Staging Volume',
                    schema: {
                      type: 'dict',
                      attrs: [
                        {
                          variable: 'datasetName',
                          label: 'IPFS Staging Volume Dataset Name',
                          schema: {
                            type: 'string',
                            hidden: true,
                            $ref: [
                              'normalize/ixVolume',
                            ],
                            show_if: [
                              [
                                'hostPathEnabled',
                                '=',
                                false,
                              ],
                            ],
                            default: 'ix-ipfs-staging',
                            editable: false,
                          },
                        },
                        {
                          variable: 'mountPath',
                          label: 'IPFS Staging Mount Path',
                          description: 'Path where the volume will be mounted inside the pod',
                          schema: {
                            type: 'path',
                            hidden: true,
                            editable: false,
                            default: '/export',
                          },
                        },
                        {
                          variable: 'hostPathEnabled',
                          label: 'Enable Host Path for IPFS Staging Volume',
                          schema: {
                            type: 'boolean',
                            default: false,
                            show_subquestions_if: true,
                            subquestions: [
                              {
                                variable: 'hostPath',
                                label: 'Host Path for IPFS Staging Volume',
                                schema: {
                                  type: 'hostpath',
                                  required: true,
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                  {
                    variable: 'data',
                    label: 'Data Volume',
                    schema: {
                      type: 'dict',
                      attrs: [
                        {
                          variable: 'datasetName',
                          label: 'IPFS Data Volume Name',
                          schema: {
                            type: 'string',
                            hidden: true,
                            $ref: [
                              'normalize/ixVolume',
                            ],
                            show_if: [
                              [
                                'hostPathEnabled',
                                '=',
                                false,
                              ],
                            ],
                            default: 'ix-ipfs-data',
                            editable: false,
                          },
                        },
                        {
                          variable: 'mountPath',
                          label: 'IPFS Data Mount Path',
                          description: 'Path where the volume will be mounted inside the pod',
                          schema: {
                            type: 'path',
                            hidden: true,
                            editable: false,
                            default: '/data/ipfs',
                          },
                        },
                        {
                          variable: 'hostPathEnabled',
                          label: 'Enable Host Path for IPFS Data Volume',
                          schema: {
                            type: 'boolean',
                            default: false,
                            show_subquestions_if: true,
                            subquestions: [
                              {
                                variable: 'hostPath',
                                label: 'Host Path for IPFS Data Volume',
                                schema: {
                                  type: 'hostpath',
                                  required: true,
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
        app_readme: '<p><a href="https://ipfs.io">IPFS</a> is a global, versioned, peer-to-peer filesystem. It combines good ideas from previous systems such Git, BitTorrent, Kademlia, SFS, and the Web. It is like a single bittorrent swarm, exchanging git objects. IPFS provides an interface as simple as the HTTP web, but with permanence built in. You can also mount the world at /ipfs.</p>',
        detailed_readme: '<h1>IPFS</h1>\n<p><a href="https://ipfs.io">IPFS</a> is a global, versioned, peer-to-peer filesystem. It combines good ideas from previous systems such Git, BitTorrent, Kademlia, SFS, and the Web. It is like a single bittorrent swarm, exchanging git objects. IPFS provides an interface as simple as the HTTP web, but with permanence built in. You can also mount the world at /ipfs.</p>\n<h2>Introduction</h2>\n<p>This chart bootstraps IPFS deployment on a <a href="http://kubernetes.io">Kubernetes</a> cluster using the <a href="https://helm.sh">Helm</a> package manager.</p>\n<h2>Configuration</h2>\n<p>The following table lists the configurable parameters of the IPFS chart and their default values.</p>\n<p>| Parameter                                        | Description                                                                                                                             | Default                          |\n|:-------------------------------------------------|:----------------------------------------------------------------------------------------------------------------------------------------|:---------------------------------|\n| <code>image.repository</code>                               | Image repository                                                                                                                        | <code>ipfs/go-ipfs</code>                    |\n| <code>image.tag</code>                                      | IPFS image tag. Possible values listed <a href="https://hub.docker.com/r/ipfs/go-ipfs/tags">here</a>.                                              | <code>v0.8.0-rc1</code>   |\n| <code>image.pullPolicy</code>                               | Image pull policy                                                                                                                       | <code>IfNotPresent</code>                   |\n| <code>extraArgs</code>                                      | Additional command line arguments to pass to the IPFS server                                                                            | <code>[]</code>                             |</p>',
        changelog: null,
        values: {
          dnsConfig: {
            options: [],
          },
          updateStrategy: 'Recreate',
          environmentVariables: [],
          service: {
            swarmPort: 9401,
            apiPort: 9501,
            gatewayPort: 9880,
          },
          appVolumeMounts: {
            staging: {
              datasetName: 'ix-ipfs-staging',
              mountPath: '/export',
              hostPathEnabled: false,
            },
            data: {
              datasetName: 'ix-ipfs-data',
              mountPath: '/data/ipfs',
              hostPathEnabled: false,
            },
          },
        },
      },
    },
    latest_version: '1.2.1',
    latest_app_version: 'v0.12.2',
    latest_human_version: 'v0.12.2_1.2.1',
    icon_url: 'https://ipfs.io/ipfs/QmVk7srrwahXLNmcDYvyUEJptyoxpndnRa57YJ11L4jV26/ipfs.go.png',
    catalog: {
      id: 'OFFICIAL',
      train: 'charts',
    },
    schema: {
      groups: [
        {
          name: 'Container Images',
          description: 'Image to be used for container',
        },
        {
          name: 'Workload Configuration',
          description: 'Configure Storage for IPFS',
        },
        {
          name: 'Storage',
          description: 'Configure Storage for IPFS',
        },
        {
          name: 'IPFS Configuration',
          description: 'Configure Storage for IPFS',
        },
        {
          name: 'Advanced DNS Settings',
          description: 'Configure DNS settings',
        },
      ],
      portals: {
        web_portal: {
          protocols: [
            'http',
          ],
          host: [
            '$node_ip',
          ],
          ports: [
            '$variable-service.apiPort',
          ],
          path: '/webui',
        },
      },
      questions: [
        {
          variable: 'dnsConfig',
          label: 'DNS Configuration',
          group: 'Advanced DNS Settings',
          schema: {
            type: 'dict',
            attrs: [
              {
                variable: 'options',
                label: 'DNS Options',
                schema: {
                  type: 'list',
                  items: [
                    {
                      variable: 'optionsEntry',
                      label: 'Option Entry Configuration',
                      schema: {
                        type: 'dict',
                        attrs: [
                          {
                            variable: 'name',
                            label: 'Option Name',
                            schema: {
                              type: 'string',
                              required: true,
                            },
                          },
                          {
                            variable: 'value',
                            label: 'Option Value',
                            schema: {
                              type: 'string',
                              required: true,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          variable: 'updateStrategy',
          label: 'IPFS update strategy',
          group: 'Workload Configuration',
          schema: {
            type: 'string',
            default: 'Recreate',
            enum: [
              {
                value: 'RollingUpdate',
                description: 'Create new pods and then kill old ones',
              },
              {
                value: 'Recreate',
                description: 'Kill existing pods before creating new ones',
              },
            ],
          },
        },
        {
          variable: 'environmentVariables',
          label: 'IPFS image environment',
          group: 'IPFS Configuration',
          schema: {
            type: 'list',
            default: [],
            items: [
              {
                variable: 'environmentVariable',
                label: 'Environment Variable',
                schema: {
                  type: 'dict',
                  attrs: [
                    {
                      variable: 'name',
                      label: 'Name',
                      schema: {
                        type: 'string',
                      },
                    },
                    {
                      variable: 'value',
                      label: 'Value',
                      schema: {
                        type: 'string',
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          variable: 'service',
          description: 'IPFS Service Configuration',
          label: 'IPFS Service Configuration',
          group: 'IPFS Configuration',
          schema: {
            type: 'dict',
            required: true,
            attrs: [
              {
                variable: 'swarmPort',
                label: 'Swarm Port to use for IPFS (Public)',
                schema: {
                  type: 'int',
                  min: 9000,
                  max: 65535,
                  default: 9401,
                  required: true,
                },
              },
              {
                variable: 'apiPort',
                label: 'API Port to use for IPFS (local)',
                schema: {
                  type: 'int',
                  min: 9000,
                  max: 65535,
                  default: 9501,
                  required: true,
                },
              },
              {
                variable: 'gatewayPort',
                label: 'Gateway Port to use for IPFS (local)',
                schema: {
                  type: 'int',
                  min: 9000,
                  max: 65535,
                  default: 9880,
                  required: true,
                },
              },
            ],
          },
        },
        {
          variable: 'appVolumeMounts',
          label: 'IPFS Storage',
          group: 'Storage',
          schema: {
            type: 'dict',
            attrs: [
              {
                variable: 'staging',
                label: 'Staging Volume',
                schema: {
                  type: 'dict',
                  attrs: [
                    {
                      variable: 'datasetName',
                      label: 'IPFS Staging Volume Dataset Name',
                      schema: {
                        type: 'string',
                        hidden: true,
                        $ref: [
                          'normalize/ixVolume',
                        ],
                        show_if: [
                          [
                            'hostPathEnabled',
                            '=',
                            false,
                          ],
                        ],
                        default: 'ix-ipfs-staging',
                        editable: false,
                      },
                    },
                    {
                      variable: 'mountPath',
                      label: 'IPFS Staging Mount Path',
                      description: 'Path where the volume will be mounted inside the pod',
                      schema: {
                        type: 'path',
                        hidden: true,
                        editable: false,
                        default: '/export',
                      },
                    },
                    {
                      variable: 'hostPathEnabled',
                      label: 'Enable Host Path for IPFS Staging Volume',
                      schema: {
                        type: 'boolean',
                        default: false,
                        show_subquestions_if: true,
                        subquestions: [
                          {
                            variable: 'hostPath',
                            label: 'Host Path for IPFS Staging Volume',
                            schema: {
                              type: 'hostpath',
                              required: true,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              {
                variable: 'data',
                label: 'Data Volume',
                schema: {
                  type: 'dict',
                  attrs: [
                    {
                      variable: 'datasetName',
                      label: 'IPFS Data Volume Name',
                      schema: {
                        type: 'string',
                        hidden: true,
                        $ref: [
                          'normalize/ixVolume',
                        ],
                        show_if: [
                          [
                            'hostPathEnabled',
                            '=',
                            false,
                          ],
                        ],
                        default: 'ix-ipfs-data',
                        editable: false,
                      },
                    },
                    {
                      variable: 'mountPath',
                      label: 'IPFS Data Mount Path',
                      description: 'Path where the volume will be mounted inside the pod',
                      schema: {
                        type: 'path',
                        hidden: true,
                        editable: false,
                        default: '/data/ipfs',
                      },
                    },
                    {
                      variable: 'hostPathEnabled',
                      label: 'Enable Host Path for IPFS Data Volume',
                      schema: {
                        type: 'boolean',
                        default: false,
                        show_subquestions_if: true,
                        subquestions: [
                          {
                            variable: 'hostPath',
                            label: 'Host Path for IPFS Data Volume',
                            schema: {
                              type: 'hostpath',
                              required: true,
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  } as any;

  const existingChartEdit = {
    name: 'app_name',
    config: {
      apiPort: 8927,
      appVolumeMounts: {
        config: {
          datasetName: 'config',
          hostPathEnabled: false,
          mountPath: '/root/.chia',
        },
        plots: {
          datasetName: 'plots',
          hostPathEnabled: false,
          mountPath: '/plots',
        },
        plotting: {
          datasetName: 'plotting',
          hostPathEnabled: false,
          mountPath: '/plotting',
        },
      },
      btcgreen: {
        apiPort: 8938,
        environmentVariables: [

        ],
        farmerPort: 18655,
        ports: [
          {
            containerPort: 8938,
            name: 'api',
            protocol: 'TCP',
          },
          {
            containerPort: 9282,
            name: 'blockchain',
            protocol: 'TCP',
          },
          {
            containerPort: 18655,
            name: 'farming',
            protocol: 'TCP',
          },
        ],
        volumeMounts: {
          config: {
            datasetName: 'btcgreen-config',
            hostPathEnabled: false,
            mountPath: '/root/.chia',
          },
          mnemonic: {
            datasetName: 'config',
            hostPathEnabled: false,
            mountPath: '/root/.chia/mnemonic.txt',
            readOnly: true,
            subPath: 'mnemonic.txt',
          },
        },
      },
      btcgreenEnabled: false,
      cactus: {
        apiPort: 8936,
        environmentVariables: [

        ],
        farmerPort: 11447,
        ports: [
          {
            containerPort: 8936,
            hostPort: 8936,
            name: 'api',
            protocol: 'TCP',
          },
          {
            containerPort: 11444,
            hostPort: 11444,
            name: 'blockchain',
            protocol: 'TCP',
          },
          {
            containerPort: 11447,
            hostPort: 11447,
            name: 'farming',
            protocol: 'TCP',
          },
        ],
        volumeMounts: {
          config: {
            datasetName: 'cactus-config',
            hostPathEnabled: false,
            mountPath: '/root/.chia',
          },
          mnemonic: {
            datasetName: 'config',
            hostPathEnabled: false,
            mountPath: '/root/.chia/mnemonic.txt',
            readOnly: true,
            subPath: 'mnemonic.txt',
          },
        },
      },
      cactusEnabled: false,
      chives: {
        apiPort: 8931,
        environmentVariables: [

        ],
        farmerPort: 9647,
        ports: [
          {
            containerPort: 8931,
            name: 'api',
            protocol: 'TCP',
          },
          {
            containerPort: 9699,
            name: 'blockchain',
            protocol: 'TCP',
          },
          {
            containerPort: 9647,
            name: 'farming',
            protocol: 'TCP',
          },
        ],
        volumeMounts: {
          config: {
            datasetName: 'chives-config',
            hostPathEnabled: false,
            mountPath: '/root/.chia',
          },
          mnemonic: {
            datasetName: 'config',
            hostPathEnabled: false,
            mountPath: '/root/.chia/mnemonic.txt',
            readOnly: true,
            subPath: 'mnemonic.txt',
          },
        },
      },
      chivesEnabled: false,
      coins: [
        'cactus',
        'chives',
        'cryptodoge',
        'flax',
        'flora',
        'hddcoin',
        'maize',
        'nchain',
        'staicoin',
        'stor',
        'btcgreen',
        'shibgreen',
      ],
      cpuLimit: '123',
      cryptodoge: {
        apiPort: 8937,
        environmentVariables: [

        ],
        farmerPort: 16895,
        ports: [
          {
            containerPort: 8937,
            name: 'api',
            protocol: 'TCP',
          },
          {
            containerPort: 15994,
            name: 'blockchain',
            protocol: 'TCP',
          },
          {
            containerPort: 16895,
            name: 'farming',
            protocol: 'TCP',
          },
        ],
        volumeMounts: {
          config: {
            datasetName: 'cryptodoge-config',
            hostPathEnabled: false,
            mountPath: '/root/.chia',
          },
          mnemonic: {
            datasetName: 'config',
            hostPathEnabled: false,
            mountPath: '/root/.chia/mnemonic.txt',
            readOnly: true,
            subPath: 'mnemonic.txt',
          },
        },
      },
      cryptodogeEnabled: false,
      enableResourceLimits: true,
      environmentVariables: [

      ],
      extraAppVolumeMounts: [

      ],
      farmerPort: 8447,
      flax: {
        apiPort: 8928,
        environmentVariables: [

        ],
        farmerPort: 6885,
        ports: [
          {
            containerPort: 8928,
            name: 'api',
            protocol: 'TCP',
          },
          {
            containerPort: 6888,
            name: 'blockchain',
            protocol: 'TCP',
          },
          {
            containerPort: 6885,
            name: 'farming',
            protocol: 'TCP',
          },
        ],
        volumeMounts: {
          config: {
            datasetName: 'flax-config',
            hostPathEnabled: false,
            mountPath: '/root/.chia',
          },
          mnemonic: {
            datasetName: 'config',
            hostPathEnabled: false,
            mountPath: '/root/.chia/mnemonic.txt',
            readOnly: true,
            subPath: 'mnemonic.txt',
          },
        },
      },
      flaxEnabled: false,
      flora: {
        apiPort: 8932,
        environmentVariables: [

        ],
        farmerPort: 18647,
        ports: [
          {
            containerPort: 8932,
            name: 'api',
            protocol: 'TCP',
          },
          {
            containerPort: 18644,
            name: 'blockchain',
            protocol: 'TCP',
          },
          {
            containerPort: 18647,
            name: 'farming',
            protocol: 'TCP',
          },
        ],
        volumeMounts: {
          config: {
            datasetName: 'flora-config',
            hostPathEnabled: false,
            mountPath: '/root/.chia',
          },
          mnemonic: {
            datasetName: 'config',
            hostPathEnabled: false,
            mountPath: '/root/.chia/mnemonic.txt',
            readOnly: true,
            subPath: 'mnemonic.txt',
          },
        },
      },
      floraEnabled: false,
      global: {
        ixChartContext: {
          isInstall: false,
          isUpdate: true,
          isUpgrade: false,
          operation: 'UPDATE',
          storageClassName: 'ix-storage-class-app_name',
          upgradeMetadata: {

          },
        },
      },
      hddcoin: {
        apiPort: 8930,
        environmentVariables: [

        ],
        farmerPort: 28447,
        ports: [
          {
            containerPort: 8930,
            name: 'api',
            protocol: 'TCP',
          },
          {
            containerPort: 28444,
            name: 'blockchain',
            protocol: 'TCP',
          },
          {
            containerPort: 28447,
            name: 'farming',
            protocol: 'TCP',
          },
        ],
        volumeMounts: {
          config: {
            datasetName: 'hddcoin-config',
            hostPathEnabled: false,
            mountPath: '/root/.chia',
          },
          mnemonic: {
            datasetName: 'config',
            hostPathEnabled: false,
            mountPath: '/root/.chia/mnemonic.txt',
            readOnly: true,
            subPath: 'mnemonic.txt',
          },
        },
      },
      hddcoinEnabled: false,
      image: {
        pullPolicy: 'IfNotPresent',
        repository: 'ghcr.io/guydavis/machinaris',
        tag: 'v0.7.1',
      },
      ixCertificateAuthorities: {

      },
      ixCertificates: {

      },
      ixChartContext: {
        isInstall: false,
        isUpdate: true,
        isUpgrade: false,
        operation: 'UPDATE',
        storageClassName: 'ix-storage-class-app_name',
        upgradeMetadata: {

        },
      },
      ixExternalInterfacesConfiguration: [

      ],
      ixExternalInterfacesConfigurationNames: [

      ],
      ixVolumes: [
        {
          hostPath: '/mnt/my pool/ix-applications/releases/app_name/volumes/ix_volumes/config',
        },
        {
          hostPath: '/mnt/my pool/ix-applications/releases/app_name/volumes/ix_volumes/plots',
        },
        {
          hostPath: '/mnt/my pool/ix-applications/releases/app_name/volumes/ix_volumes/plotting',
        },
        {
          hostPath: '/mnt/my pool/ix-applications/releases/app_name/volumes/ix_volumes/cactus-config',
        },
        {
          hostPath: '/mnt/my pool/ix-applications/releases/app_name/volumes/ix_volumes/chives-config',
        },
        {
          hostPath: '/mnt/my pool/ix-applications/releases/app_name/volumes/ix_volumes/cryptodoge-config',
        },
        {
          hostPath: '/mnt/my pool/ix-applications/releases/app_name/volumes/ix_volumes/flax-config',
        },
        {
          hostPath: '/mnt/my pool/ix-applications/releases/app_name/volumes/ix_volumes/flora-config',
        },
        {
          hostPath: '/mnt/my pool/ix-applications/releases/app_name/volumes/ix_volumes/hddcoin-config',
        },
        {
          hostPath: '/mnt/my pool/ix-applications/releases/app_name/volumes/ix_volumes/maize-config',
        },
        {
          hostPath: '/mnt/my pool/ix-applications/releases/app_name/volumes/ix_volumes/nchain-config',
        },
        {
          hostPath: '/mnt/my pool/ix-applications/releases/app_name/volumes/ix_volumes/staicoin-config',
        },
        {
          hostPath: '/mnt/my pool/ix-applications/releases/app_name/volumes/ix_volumes/stor-config',
        },
        {
          hostPath: '/mnt/my pool/ix-applications/releases/app_name/volumes/ix_volumes/btcgreen-config',
        },
        {
          hostPath: '/mnt/my pool/ix-applications/releases/app_name/volumes/ix_volumes/shibgreen-config',
        },
      ],
      machinarisApiPort: 8927,
      machinaris_ui_port: 9003,
      maize: {
        apiPort: 8933,
        environmentVariables: [
          {
            name: 'name1',
            value: 'value2',
          },
          {
            name: 'name1',
            value: 'value2',
          },
        ],
        farmerPort: 8647,
        ports: [
          {
            containerPort: 8933,
            name: 'api',
            protocol: 'TCP',
          },
          {
            containerPort: 8644,
            name: 'blockchain',
            protocol: 'TCP',
          },
          {
            containerPort: 8647,
            name: 'farming',
            protocol: 'TCP',
          },
        ],
        volumeMounts: {
          config: {
            datasetName: 'maize-config',
            hostPath: '/mnt/my pool',
            hostPathEnabled: true,
            mountPath: '/root/.chia',
          },
          mnemonic: {
            datasetName: 'config',
            hostPathEnabled: false,
            mountPath: '/root/.chia/mnemonic.txt',
            readOnly: true,
            subPath: 'mnemonic.txt',
          },
        },
      },
      maizeEnabled: true,
      memLimit: '1234',
      nchain: {
        apiPort: 8929,
        environmentVariables: [

        ],
        farmerPort: 38447,
        ports: [
          {
            containerPort: 8929,
            name: 'api',
            protocol: 'TCP',
          },
          {
            containerPort: 58445,
            name: 'blockchain',
            protocol: 'TCP',
          },
          {
            containerPort: 38447,
            name: 'farming',
            protocol: 'TCP',
          },
        ],
        volumeMounts: {
          config: {
            datasetName: 'nchain-config',
            hostPathEnabled: false,
            mountPath: '/root/.chia',
          },
          mnemonic: {
            datasetName: 'config',
            hostPathEnabled: false,
            mountPath: '/root/.chia/mnemonic.txt',
            readOnly: true,
            subPath: 'mnemonic.txt',
          },
        },
      },
      nchainEnabled: false,
      nodeIP: '192.168.1.100',
      ports: [
        {
          containerPort: 8444,
          hostPort: 8444,
          name: 'chia-network',
          protocol: 'TCP',
        },
        {
          containerPort: 8926,
          name: 'machinaris-ui',
          protocol: 'TCP',
        },
        {
          containerPort: 8927,
          hostPort: 8927,
          name: 'machinaris-api',
          protocol: 'TCP',
        },
        {
          containerPort: 8447,
          hostPort: 8447,
          name: 'farming',
          protocol: 'TCP',
        },
      ],
      release_name: 'app_name',
      shibgreen: {
        apiPort: 8939,
        environmentVariables: [
          {
            name: 'z',
            value: 'zz',
          },
        ],
        farmerPort: 18974,
        ports: [
          {
            containerPort: 8939,
            name: 'api',
            protocol: 'TCP',
          },
          {
            containerPort: 7442,
            name: 'blockchain',
            protocol: 'TCP',
          },
          {
            containerPort: 18974,
            name: 'farming',
            protocol: 'TCP',
          },
        ],
        volumeMounts: {
          config: {
            datasetName: 'shibgreen-config',
            hostPathEnabled: false,
            mountPath: '/root/.chia',
          },
          mnemonic: {
            datasetName: 'config',
            hostPathEnabled: false,
            mountPath: '/root/.chia/mnemonic.txt',
            readOnly: true,
            subPath: 'mnemonic.txt',
          },
        },
      },
      shibgreenEnabled: false,
      staicoin: {
        apiPort: 8934,
        environmentVariables: [

        ],
        farmerPort: 1692,
        ports: [
          {
            containerPort: 8934,
            name: 'api',
            protocol: 'TCP',
          },
          {
            containerPort: 1999,
            name: 'blockchain',
            protocol: 'TCP',
          },
          {
            containerPort: 1692,
            name: 'farming',
            protocol: 'TCP',
          },
        ],
        volumeMounts: {
          config: {
            datasetName: 'staicoin-config',
            hostPathEnabled: false,
            mountPath: '/root/.chia',
          },
          mnemonic: {
            datasetName: 'config',
            hostPathEnabled: false,
            mountPath: '/root/.chia/mnemonic.txt',
            readOnly: true,
            subPath: 'mnemonic.txt',
          },
        },
      },
      staicoinEnabled: false,
      stor: {
        apiPort: 8935,
        environmentVariables: [

        ],
        farmerPort: 8337,
        ports: [
          {
            containerPort: 8935,
            name: 'api',
            protocol: 'TCP',
          },
          {
            containerPort: 8668,
            name: 'blockchain',
            protocol: 'TCP',
          },
          {
            containerPort: 8337,
            name: 'farming',
            protocol: 'TCP',
          },
        ],
        volumeMounts: {
          config: {
            datasetName: 'stor-config',
            hostPathEnabled: false,
            mountPath: '/root/.chia',
          },
          mnemonic: {
            datasetName: 'config',
            hostPathEnabled: false,
            mountPath: '/root/.chia/mnemonic.txt',
            readOnly: true,
            subPath: 'mnemonic.txt',
          },
        },
      },
      storEnabled: false,
      timezone: 'America/Los_Angeles',
      updateStrategy: 'Recreate',
    },
    chart_schema: {
      location: '/mnt/my pool/ix-applications/releases/app_name/charts/1.1.4',
      required_features: [
        'definitions/timezone',
        'definitions/nodeIP',
        'normalize/ixVolume',
      ],
      chart_metadata: {
        apiVersion: 'v1',
        appVersion: 'v0.7.1',
        dependencies: [
          {
            name: 'common',
            repository: 'file://../../../library/common/2112.0.0',
            version: '2112.0.0',
          },
        ],
        description: 'Global, Versioned, peer-to-peer filesystem.',
        home: 'https://github.com/guydavis/machinaris',
        icon: 'https://raw.githubusercontent.com/guydavis/machinaris/main/web/static/favicon.ico',
        keywords: [
          'storage',
          'crypto',
          'blockchain',
        ],
        name: 'machinaris',
        sources: [
          'https://github.com/guydavis/machinaris',
        ],
        version: '1.1.4',
      },
      schema: {
        groups: [
          {
            name: 'Networking',
            description: 'Configure Networking for Machinaris',
          },
          {
            name: 'Machinaris Configuration',
            description: 'Machinaris configuration',
          },
          {
            name: 'Storage',
            description: 'Configure Storage for Machinaris',
          },
          {
            name: 'Machinaris Environment Variables',
            description: 'Set the environment that will be visible to the container',
          },
          {
            name: 'Resource Limits',
            description: 'Set CPU/memory limits for Kubernetes Pod',
          },
          {
            name: 'Configure Coins',
            description: 'Configure different coins',
          },
        ],
        portals: {
          web_portal: {
            protocols: [
              'http',
            ],
            host: [
              '$node_ip',
            ],
            ports: [
              '$variable-machinaris_ui_port',
            ],
          },
        },
        questions: [
          {
            variable: 'timezone',
            label: 'Configure timezone',
            group: 'Machinaris Configuration',
            description: 'Configure timezone for machinaris',
            schema: {
              type: 'string',
              $ref: [
                'definitions/timezone',
              ],
              enum: [
                {
                  value: 'CST6CDT',
                  description: "'CST6CDT' timezone",
                },
                {
                  value: 'Factory',
                  description: "'Factory' timezone",
                },
                {
                  value: 'leapseconds',
                  description: "'leapseconds' timezone",
                },
                {
                  value: 'EST',
                  description: "'EST' timezone",
                },
                {
                  value: 'MET',
                  description: "'MET' timezone",
                },
                {
                  value: 'EET',
                  description: "'EET' timezone",
                },
                {
                  value: 'EST5EDT',
                  description: "'EST5EDT' timezone",
                },
                {
                  value: 'MST',
                  description: "'MST' timezone",
                },
                {
                  value: 'Pacific/Chatham',
                  description: "'Pacific/Chatham' timezone",
                },
                {
                  value: 'Pacific/Chuuk',
                  description: "'Pacific/Chuuk' timezone",
                },
                {
                  value: 'Pacific/Norfolk',
                  description: "'Pacific/Norfolk' timezone",
                },
                {
                  value: 'Pacific/Pago_Pago',
                  description: "'Pacific/Pago_Pago' timezone",
                },
                {
                  value: 'Pacific/Tarawa',
                  description: "'Pacific/Tarawa' timezone",
                },
                {
                  value: 'Pacific/Auckland',
                  description: "'Pacific/Auckland' timezone",
                },
                {
                  value: 'Pacific/Wallis',
                  description: "'Pacific/Wallis' timezone",
                },
                {
                  value: 'Pacific/Niue',
                  description: "'Pacific/Niue' timezone",
                },
                {
                  value: 'Pacific/Nauru',
                  description: "'Pacific/Nauru' timezone",
                },
                {
                  value: 'Pacific/Gambier',
                  description: "'Pacific/Gambier' timezone",
                },
                {
                  value: 'Pacific/Fiji',
                  description: "'Pacific/Fiji' timezone",
                },
                {
                  value: 'Pacific/Marquesas',
                  description: "'Pacific/Marquesas' timezone",
                },
                {
                  value: 'Pacific/Fakaofo',
                  description: "'Pacific/Fakaofo' timezone",
                },
                {
                  value: 'Pacific/Rarotonga',
                  description: "'Pacific/Rarotonga' timezone",
                },
                {
                  value: 'Pacific/Majuro',
                  description: "'Pacific/Majuro' timezone",
                },
                {
                  value: 'Pacific/Kosrae',
                  description: "'Pacific/Kosrae' timezone",
                },
                {
                  value: 'Pacific/Pitcairn',
                  description: "'Pacific/Pitcairn' timezone",
                },
                {
                  value: 'Pacific/Enderbury',
                  description: "'Pacific/Enderbury' timezone",
                },
                {
                  value: 'Pacific/Funafuti',
                  description: "'Pacific/Funafuti' timezone",
                },
                {
                  value: 'Pacific/Tongatapu',
                  description: "'Pacific/Tongatapu' timezone",
                },
                {
                  value: 'Pacific/Guam',
                  description: "'Pacific/Guam' timezone",
                },
                {
                  value: 'Pacific/Galapagos',
                  description: "'Pacific/Galapagos' timezone",
                },
                {
                  value: 'Pacific/Easter',
                  description: "'Pacific/Easter' timezone",
                },
                {
                  value: 'Pacific/Apia',
                  description: "'Pacific/Apia' timezone",
                },
                {
                  value: 'Pacific/Guadalcanal',
                  description: "'Pacific/Guadalcanal' timezone",
                },
                {
                  value: 'Pacific/Wake',
                  description: "'Pacific/Wake' timezone",
                },
                {
                  value: 'Pacific/Port_Moresby',
                  description: "'Pacific/Port_Moresby' timezone",
                },
                {
                  value: 'Pacific/Kiritimati',
                  description: "'Pacific/Kiritimati' timezone",
                },
                {
                  value: 'Pacific/Honolulu',
                  description: "'Pacific/Honolulu' timezone",
                },
                {
                  value: 'Pacific/Bougainville',
                  description: "'Pacific/Bougainville' timezone",
                },
                {
                  value: 'Pacific/Palau',
                  description: "'Pacific/Palau' timezone",
                },
                {
                  value: 'Pacific/Kwajalein',
                  description: "'Pacific/Kwajalein' timezone",
                },
                {
                  value: 'Pacific/Pohnpei',
                  description: "'Pacific/Pohnpei' timezone",
                },
                {
                  value: 'Pacific/Noumea',
                  description: "'Pacific/Noumea' timezone",
                },
                {
                  value: 'Pacific/Tahiti',
                  description: "'Pacific/Tahiti' timezone",
                },
                {
                  value: 'Pacific/Efate',
                  description: "'Pacific/Efate' timezone",
                },
                {
                  value: 'Africa/Algiers',
                  description: "'Africa/Algiers' timezone",
                },
                {
                  value: 'Africa/Maputo',
                  description: "'Africa/Maputo' timezone",
                },
                {
                  value: 'Africa/Tunis',
                  description: "'Africa/Tunis' timezone",
                },
                {
                  value: 'Africa/Tripoli',
                  description: "'Africa/Tripoli' timezone",
                },
                {
                  value: 'Africa/Juba',
                  description: "'Africa/Juba' timezone",
                },
                {
                  value: 'Africa/Cairo',
                  description: "'Africa/Cairo' timezone",
                },
                {
                  value: 'Africa/Ndjamena',
                  description: "'Africa/Ndjamena' timezone",
                },
                {
                  value: 'Africa/Johannesburg',
                  description: "'Africa/Johannesburg' timezone",
                },
                {
                  value: 'Africa/Abidjan',
                  description: "'Africa/Abidjan' timezone",
                },
                {
                  value: 'Africa/Ceuta',
                  description: "'Africa/Ceuta' timezone",
                },
                {
                  value: 'Africa/Windhoek',
                  description: "'Africa/Windhoek' timezone",
                },
                {
                  value: 'Africa/Accra',
                  description: "'Africa/Accra' timezone",
                },
                {
                  value: 'Africa/Monrovia',
                  description: "'Africa/Monrovia' timezone",
                },
                {
                  value: 'Africa/Lagos',
                  description: "'Africa/Lagos' timezone",
                },
                {
                  value: 'Africa/Nairobi',
                  description: "'Africa/Nairobi' timezone",
                },
                {
                  value: 'Africa/Sao_Tome',
                  description: "'Africa/Sao_Tome' timezone",
                },
                {
                  value: 'Africa/El_Aaiun',
                  description: "'Africa/El_Aaiun' timezone",
                },
                {
                  value: 'Africa/Khartoum',
                  description: "'Africa/Khartoum' timezone",
                },
                {
                  value: 'Africa/Bissau',
                  description: "'Africa/Bissau' timezone",
                },
                {
                  value: 'Africa/Casablanca',
                  description: "'Africa/Casablanca' timezone",
                },
                {
                  value: 'Indian/Mahe',
                  description: "'Indian/Mahe' timezone",
                },
                {
                  value: 'Indian/Cocos',
                  description: "'Indian/Cocos' timezone",
                },
                {
                  value: 'Indian/Mauritius',
                  description: "'Indian/Mauritius' timezone",
                },
                {
                  value: 'Indian/Chagos',
                  description: "'Indian/Chagos' timezone",
                },
                {
                  value: 'Indian/Reunion',
                  description: "'Indian/Reunion' timezone",
                },
                {
                  value: 'Indian/Maldives',
                  description: "'Indian/Maldives' timezone",
                },
                {
                  value: 'Indian/Christmas',
                  description: "'Indian/Christmas' timezone",
                },
                {
                  value: 'Indian/Kerguelen',
                  description: "'Indian/Kerguelen' timezone",
                },
                {
                  value: 'Asia/Ho_Chi_Minh',
                  description: "'Asia/Ho_Chi_Minh' timezone",
                },
                {
                  value: 'Asia/Ashgabat',
                  description: "'Asia/Ashgabat' timezone",
                },
                {
                  value: 'Asia/Taipei',
                  description: "'Asia/Taipei' timezone",
                },
                {
                  value: 'Asia/Qostanay',
                  description: "'Asia/Qostanay' timezone",
                },
                {
                  value: 'Asia/Pontianak',
                  description: "'Asia/Pontianak' timezone",
                },
                {
                  value: 'Asia/Bishkek',
                  description: "'Asia/Bishkek' timezone",
                },
                {
                  value: 'Asia/Dubai',
                  description: "'Asia/Dubai' timezone",
                },
                {
                  value: 'Asia/Yekaterinburg',
                  description: "'Asia/Yekaterinburg' timezone",
                },
                {
                  value: 'Asia/Kathmandu',
                  description: "'Asia/Kathmandu' timezone",
                },
                {
                  value: 'Asia/Hong_Kong',
                  description: "'Asia/Hong_Kong' timezone",
                },
                {
                  value: 'Asia/Vladivostok',
                  description: "'Asia/Vladivostok' timezone",
                },
                {
                  value: 'Asia/Tashkent',
                  description: "'Asia/Tashkent' timezone",
                },
                {
                  value: 'Asia/Tbilisi',
                  description: "'Asia/Tbilisi' timezone",
                },
                {
                  value: 'Asia/Yakutsk',
                  description: "'Asia/Yakutsk' timezone",
                },
                {
                  value: 'Asia/Sakhalin',
                  description: "'Asia/Sakhalin' timezone",
                },
                {
                  value: 'Asia/Magadan',
                  description: "'Asia/Magadan' timezone",
                },
                {
                  value: 'Asia/Brunei',
                  description: "'Asia/Brunei' timezone",
                },
                {
                  value: 'Asia/Qyzylorda',
                  description: "'Asia/Qyzylorda' timezone",
                },
                {
                  value: 'Asia/Karachi',
                  description: "'Asia/Karachi' timezone",
                },
                {
                  value: 'Asia/Hovd',
                  description: "'Asia/Hovd' timezone",
                },
                {
                  value: 'Asia/Ulaanbaatar',
                  description: "'Asia/Ulaanbaatar' timezone",
                },
                {
                  value: 'Asia/Atyrau',
                  description: "'Asia/Atyrau' timezone",
                },
                {
                  value: 'Asia/Barnaul',
                  description: "'Asia/Barnaul' timezone",
                },
                {
                  value: 'Asia/Omsk',
                  description: "'Asia/Omsk' timezone",
                },
                {
                  value: 'Asia/Irkutsk',
                  description: "'Asia/Irkutsk' timezone",
                },
                {
                  value: 'Asia/Almaty',
                  description: "'Asia/Almaty' timezone",
                },
                {
                  value: 'Asia/Kabul',
                  description: "'Asia/Kabul' timezone",
                },
                {
                  value: 'Asia/Novosibirsk',
                  description: "'Asia/Novosibirsk' timezone",
                },
                {
                  value: 'Asia/Jakarta',
                  description: "'Asia/Jakarta' timezone",
                },
                {
                  value: 'Asia/Baku',
                  description: "'Asia/Baku' timezone",
                },
                {
                  value: 'Asia/Bangkok',
                  description: "'Asia/Bangkok' timezone",
                },
                {
                  value: 'Asia/Kuala_Lumpur',
                  description: "'Asia/Kuala_Lumpur' timezone",
                },
                {
                  value: 'Asia/Urumqi',
                  description: "'Asia/Urumqi' timezone",
                },
                {
                  value: 'Asia/Thimphu',
                  description: "'Asia/Thimphu' timezone",
                },
                {
                  value: 'Asia/Manila',
                  description: "'Asia/Manila' timezone",
                },
                {
                  value: 'Asia/Beirut',
                  description: "'Asia/Beirut' timezone",
                },
                {
                  value: 'Asia/Kuching',
                  description: "'Asia/Kuching' timezone",
                },
                {
                  value: 'Asia/Tehran',
                  description: "'Asia/Tehran' timezone",
                },
                {
                  value: 'Asia/Seoul',
                  description: "'Asia/Seoul' timezone",
                },
                {
                  value: 'Asia/Gaza',
                  description: "'Asia/Gaza' timezone",
                },
                {
                  value: 'Asia/Aqtau',
                  description: "'Asia/Aqtau' timezone",
                },
                {
                  value: 'Asia/Dushanbe',
                  description: "'Asia/Dushanbe' timezone",
                },
                {
                  value: 'Asia/Anadyr',
                  description: "'Asia/Anadyr' timezone",
                },
                {
                  value: 'Asia/Famagusta',
                  description: "'Asia/Famagusta' timezone",
                },
                {
                  value: 'Asia/Dili',
                  description: "'Asia/Dili' timezone",
                },
                {
                  value: 'Asia/Pyongyang',
                  description: "'Asia/Pyongyang' timezone",
                },
                {
                  value: 'Asia/Jayapura',
                  description: "'Asia/Jayapura' timezone",
                },
                {
                  value: 'Asia/Tomsk',
                  description: "'Asia/Tomsk' timezone",
                },
                {
                  value: 'Asia/Nicosia',
                  description: "'Asia/Nicosia' timezone",
                },
                {
                  value: 'Asia/Colombo',
                  description: "'Asia/Colombo' timezone",
                },
                {
                  value: 'Asia/Ust-Nera',
                  description: "'Asia/Ust-Nera' timezone",
                },
                {
                  value: 'Asia/Singapore',
                  description: "'Asia/Singapore' timezone",
                },
                {
                  value: 'Asia/Qatar',
                  description: "'Asia/Qatar' timezone",
                },
                {
                  value: 'Asia/Shanghai',
                  description: "'Asia/Shanghai' timezone",
                },
                {
                  value: 'Asia/Novokuznetsk',
                  description: "'Asia/Novokuznetsk' timezone",
                },
                {
                  value: 'Asia/Baghdad',
                  description: "'Asia/Baghdad' timezone",
                },
                {
                  value: 'Asia/Hebron',
                  description: "'Asia/Hebron' timezone",
                },
                {
                  value: 'Asia/Chita',
                  description: "'Asia/Chita' timezone",
                },
                {
                  value: 'Asia/Krasnoyarsk',
                  description: "'Asia/Krasnoyarsk' timezone",
                },
                {
                  value: 'Asia/Khandyga',
                  description: "'Asia/Khandyga' timezone",
                },
                {
                  value: 'Asia/Srednekolymsk',
                  description: "'Asia/Srednekolymsk' timezone",
                },
                {
                  value: 'Asia/Kolkata',
                  description: "'Asia/Kolkata' timezone",
                },
                {
                  value: 'Asia/Riyadh',
                  description: "'Asia/Riyadh' timezone",
                },
                {
                  value: 'Asia/Tokyo',
                  description: "'Asia/Tokyo' timezone",
                },
                {
                  value: 'Asia/Dhaka',
                  description: "'Asia/Dhaka' timezone",
                },
                {
                  value: 'Asia/Choibalsan',
                  description: "'Asia/Choibalsan' timezone",
                },
                {
                  value: 'Asia/Yerevan',
                  description: "'Asia/Yerevan' timezone",
                },
                {
                  value: 'Asia/Amman',
                  description: "'Asia/Amman' timezone",
                },
                {
                  value: 'Asia/Yangon',
                  description: "'Asia/Yangon' timezone",
                },
                {
                  value: 'Asia/Samarkand',
                  description: "'Asia/Samarkand' timezone",
                },
                {
                  value: 'Asia/Macau',
                  description: "'Asia/Macau' timezone",
                },
                {
                  value: 'Asia/Makassar',
                  description: "'Asia/Makassar' timezone",
                },
                {
                  value: 'Asia/Oral',
                  description: "'Asia/Oral' timezone",
                },
                {
                  value: 'Asia/Jerusalem',
                  description: "'Asia/Jerusalem' timezone",
                },
                {
                  value: 'Asia/Aqtobe',
                  description: "'Asia/Aqtobe' timezone",
                },
                {
                  value: 'Asia/Damascus',
                  description: "'Asia/Damascus' timezone",
                },
                {
                  value: 'Asia/Kamchatka',
                  description: "'Asia/Kamchatka' timezone",
                },
                {
                  value: 'Australia/Broken_Hill',
                  description: "'Australia/Broken_Hill' timezone",
                },
                {
                  value: 'Australia/Eucla',
                  description: "'Australia/Eucla' timezone",
                },
                {
                  value: 'Australia/Hobart',
                  description: "'Australia/Hobart' timezone",
                },
                {
                  value: 'Australia/Melbourne',
                  description: "'Australia/Melbourne' timezone",
                },
                {
                  value: 'Australia/Brisbane',
                  description: "'Australia/Brisbane' timezone",
                },
                {
                  value: 'Australia/Lindeman',
                  description: "'Australia/Lindeman' timezone",
                },
                {
                  value: 'Australia/Darwin',
                  description: "'Australia/Darwin' timezone",
                },
                {
                  value: 'Australia/Sydney',
                  description: "'Australia/Sydney' timezone",
                },
                {
                  value: 'Australia/Adelaide',
                  description: "'Australia/Adelaide' timezone",
                },
                {
                  value: 'Australia/Lord_Howe',
                  description: "'Australia/Lord_Howe' timezone",
                },
                {
                  value: 'Australia/Perth',
                  description: "'Australia/Perth' timezone",
                },
                {
                  value: 'HST',
                  description: "'HST' timezone",
                },
                {
                  value: 'America/Montevideo',
                  description: "'America/Montevideo' timezone",
                },
                {
                  value: 'America/Rankin_Inlet',
                  description: "'America/Rankin_Inlet' timezone",
                },
                {
                  value: 'America/Bahia',
                  description: "'America/Bahia' timezone",
                },
                {
                  value: 'America/Tijuana',
                  description: "'America/Tijuana' timezone",
                },
                {
                  value: 'America/Blanc-Sablon',
                  description: "'America/Blanc-Sablon' timezone",
                },
                {
                  value: 'America/Rainy_River',
                  description: "'America/Rainy_River' timezone",
                },
                {
                  value: 'America/Santo_Domingo',
                  description: "'America/Santo_Domingo' timezone",
                },
                {
                  value: 'America/Boa_Vista',
                  description: "'America/Boa_Vista' timezone",
                },
                {
                  value: 'America/Detroit',
                  description: "'America/Detroit' timezone",
                },
                {
                  value: 'America/Asuncion',
                  description: "'America/Asuncion' timezone",
                },
                {
                  value: 'America/Miquelon',
                  description: "'America/Miquelon' timezone",
                },
                {
                  value: 'America/Manaus',
                  description: "'America/Manaus' timezone",
                },
                {
                  value: 'America/Resolute',
                  description: "'America/Resolute' timezone",
                },
                {
                  value: 'America/Creston',
                  description: "'America/Creston' timezone",
                },
                {
                  value: 'America/Guatemala',
                  description: "'America/Guatemala' timezone",
                },
                {
                  value: 'America/El_Salvador',
                  description: "'America/El_Salvador' timezone",
                },
                {
                  value: 'America/Whitehorse',
                  description: "'America/Whitehorse' timezone",
                },
                {
                  value: 'America/Eirunepe',
                  description: "'America/Eirunepe' timezone",
                },
                {
                  value: 'America/Menominee',
                  description: "'America/Menominee' timezone",
                },
                {
                  value: 'America/Monterrey',
                  description: "'America/Monterrey' timezone",
                },
                {
                  value: 'America/Mexico_City',
                  description: "'America/Mexico_City' timezone",
                },
                {
                  value: 'America/Jamaica',
                  description: "'America/Jamaica' timezone",
                },
                {
                  value: 'America/Mazatlan',
                  description: "'America/Mazatlan' timezone",
                },
                {
                  value: 'America/Juneau',
                  description: "'America/Juneau' timezone",
                },
                {
                  value: 'America/Noronha',
                  description: "'America/Noronha' timezone",
                },
                {
                  value: 'America/Martinique',
                  description: "'America/Martinique' timezone",
                },
                {
                  value: 'America/Adak',
                  description: "'America/Adak' timezone",
                },
                {
                  value: 'America/New_York',
                  description: "'America/New_York' timezone",
                },
                {
                  value: 'America/Caracas',
                  description: "'America/Caracas' timezone",
                },
                {
                  value: 'America/Araguaina',
                  description: "'America/Araguaina' timezone",
                },
                {
                  value: 'America/Maceio',
                  description: "'America/Maceio' timezone",
                },
                {
                  value: 'America/Goose_Bay',
                  description: "'America/Goose_Bay' timezone",
                },
                {
                  value: 'America/Cuiaba',
                  description: "'America/Cuiaba' timezone",
                },
                {
                  value: 'America/Rio_Branco',
                  description: "'America/Rio_Branco' timezone",
                },
                {
                  value: 'America/Argentina/La_Rioja',
                  description: "'America/Argentina/La_Rioja' timezone",
                },
                {
                  value: 'America/Argentina/Mendoza',
                  description: "'America/Argentina/Mendoza' timezone",
                },
                {
                  value: 'America/Argentina/Salta',
                  description: "'America/Argentina/Salta' timezone",
                },
                {
                  value: 'America/Argentina/Jujuy',
                  description: "'America/Argentina/Jujuy' timezone",
                },
                {
                  value: 'America/Argentina/Cordoba',
                  description: "'America/Argentina/Cordoba' timezone",
                },
                {
                  value: 'America/Argentina/San_Luis',
                  description: "'America/Argentina/San_Luis' timezone",
                },
                {
                  value: 'America/Argentina/San_Juan',
                  description: "'America/Argentina/San_Juan' timezone",
                },
                {
                  value: 'America/Argentina/Tucuman',
                  description: "'America/Argentina/Tucuman' timezone",
                },
                {
                  value: 'America/Argentina/Ushuaia',
                  description: "'America/Argentina/Ushuaia' timezone",
                },
                {
                  value: 'America/Argentina/Buenos_Aires',
                  description: "'America/Argentina/Buenos_Aires' timezone",
                },
                {
                  value: 'America/Argentina/Catamarca',
                  description: "'America/Argentina/Catamarca' timezone",
                },
                {
                  value: 'America/Argentina/Rio_Gallegos',
                  description: "'America/Argentina/Rio_Gallegos' timezone",
                },
                {
                  value: 'America/Chihuahua',
                  description: "'America/Chihuahua' timezone",
                },
                {
                  value: 'America/Boise',
                  description: "'America/Boise' timezone",
                },
                {
                  value: 'America/Vancouver',
                  description: "'America/Vancouver' timezone",
                },
                {
                  value: 'America/Nome',
                  description: "'America/Nome' timezone",
                },
                {
                  value: 'America/Iqaluit',
                  description: "'America/Iqaluit' timezone",
                },
                {
                  value: 'America/Denver',
                  description: "'America/Denver' timezone",
                },
                {
                  value: 'America/Hermosillo',
                  description: "'America/Hermosillo' timezone",
                },
                {
                  value: 'America/Bogota',
                  description: "'America/Bogota' timezone",
                },
                {
                  value: 'America/Costa_Rica',
                  description: "'America/Costa_Rica' timezone",
                },
                {
                  value: 'America/Nassau',
                  description: "'America/Nassau' timezone",
                },
                {
                  value: 'America/Atikokan',
                  description: "'America/Atikokan' timezone",
                },
                {
                  value: 'America/Thule',
                  description: "'America/Thule' timezone",
                },
                {
                  value: 'America/Yellowknife',
                  description: "'America/Yellowknife' timezone",
                },
                {
                  value: 'America/Anchorage',
                  description: "'America/Anchorage' timezone",
                },
                {
                  value: 'America/Merida',
                  description: "'America/Merida' timezone",
                },
                {
                  value: 'America/Halifax',
                  description: "'America/Halifax' timezone",
                },
                {
                  value: 'America/Bahia_Banderas',
                  description: "'America/Bahia_Banderas' timezone",
                },
                {
                  value: 'America/Moncton',
                  description: "'America/Moncton' timezone",
                },
                {
                  value: 'America/Metlakatla',
                  description: "'America/Metlakatla' timezone",
                },
                {
                  value: 'America/St_Johns',
                  description: "'America/St_Johns' timezone",
                },
                {
                  value: 'America/Toronto',
                  description: "'America/Toronto' timezone",
                },
                {
                  value: 'America/Managua',
                  description: "'America/Managua' timezone",
                },
                {
                  value: 'America/Matamoros',
                  description: "'America/Matamoros' timezone",
                },
                {
                  value: 'America/Fort_Nelson',
                  description: "'America/Fort_Nelson' timezone",
                },
                {
                  value: 'America/Panama',
                  description: "'America/Panama' timezone",
                },
                {
                  value: 'America/Dawson_Creek',
                  description: "'America/Dawson_Creek' timezone",
                },
                {
                  value: 'America/Pangnirtung',
                  description: "'America/Pangnirtung' timezone",
                },
                {
                  value: 'America/Dawson',
                  description: "'America/Dawson' timezone",
                },
                {
                  value: 'America/Lima',
                  description: "'America/Lima' timezone",
                },
                {
                  value: 'America/Sao_Paulo',
                  description: "'America/Sao_Paulo' timezone",
                },
                {
                  value: 'America/Glace_Bay',
                  description: "'America/Glace_Bay' timezone",
                },
                {
                  value: 'America/Havana',
                  description: "'America/Havana' timezone",
                },
                {
                  value: 'America/Scoresbysund',
                  description: "'America/Scoresbysund' timezone",
                },
                {
                  value: 'America/Yakutat',
                  description: "'America/Yakutat' timezone",
                },
                {
                  value: 'America/Edmonton',
                  description: "'America/Edmonton' timezone",
                },
                {
                  value: 'America/Porto_Velho',
                  description: "'America/Porto_Velho' timezone",
                },
                {
                  value: 'America/Swift_Current',
                  description: "'America/Swift_Current' timezone",
                },
                {
                  value: 'America/Nipigon',
                  description: "'America/Nipigon' timezone",
                },
                {
                  value: 'America/Recife',
                  description: "'America/Recife' timezone",
                },
                {
                  value: 'America/Kentucky/Louisville',
                  description: "'America/Kentucky/Louisville' timezone",
                },
                {
                  value: 'America/Kentucky/Monticello',
                  description: "'America/Kentucky/Monticello' timezone",
                },
                {
                  value: 'America/Guayaquil',
                  description: "'America/Guayaquil' timezone",
                },
                {
                  value: 'America/Thunder_Bay',
                  description: "'America/Thunder_Bay' timezone",
                },
                {
                  value: 'America/Belem',
                  description: "'America/Belem' timezone",
                },
                {
                  value: 'America/Los_Angeles',
                  description: "'America/Los_Angeles' timezone",
                },
                {
                  value: 'America/Winnipeg',
                  description: "'America/Winnipeg' timezone",
                },
                {
                  value: 'America/Indiana/Winamac',
                  description: "'America/Indiana/Winamac' timezone",
                },
                {
                  value: 'America/Indiana/Vincennes',
                  description: "'America/Indiana/Vincennes' timezone",
                },
                {
                  value: 'America/Indiana/Indianapolis',
                  description: "'America/Indiana/Indianapolis' timezone",
                },
                {
                  value: 'America/Indiana/Tell_City',
                  description: "'America/Indiana/Tell_City' timezone",
                },
                {
                  value: 'America/Indiana/Petersburg',
                  description: "'America/Indiana/Petersburg' timezone",
                },
                {
                  value: 'America/Indiana/Marengo',
                  description: "'America/Indiana/Marengo' timezone",
                },
                {
                  value: 'America/Indiana/Vevay',
                  description: "'America/Indiana/Vevay' timezone",
                },
                {
                  value: 'America/Indiana/Knox',
                  description: "'America/Indiana/Knox' timezone",
                },
                {
                  value: 'America/Santarem',
                  description: "'America/Santarem' timezone",
                },
                {
                  value: 'America/Port_of_Spain',
                  description: "'America/Port_of_Spain' timezone",
                },
                {
                  value: 'America/Campo_Grande',
                  description: "'America/Campo_Grande' timezone",
                },
                {
                  value: 'America/North_Dakota/New_Salem',
                  description: "'America/North_Dakota/New_Salem' timezone",
                },
                {
                  value: 'America/North_Dakota/Center',
                  description: "'America/North_Dakota/Center' timezone",
                },
                {
                  value: 'America/North_Dakota/Beulah',
                  description: "'America/North_Dakota/Beulah' timezone",
                },
                {
                  value: 'America/Guyana',
                  description: "'America/Guyana' timezone",
                },
                {
                  value: 'America/Barbados',
                  description: "'America/Barbados' timezone",
                },
                {
                  value: 'America/Belize',
                  description: "'America/Belize' timezone",
                },
                {
                  value: 'America/Regina',
                  description: "'America/Regina' timezone",
                },
                {
                  value: 'America/Chicago',
                  description: "'America/Chicago' timezone",
                },
                {
                  value: 'America/Phoenix',
                  description: "'America/Phoenix' timezone",
                },
                {
                  value: 'America/Danmarkshavn',
                  description: "'America/Danmarkshavn' timezone",
                },
                {
                  value: 'America/Paramaribo',
                  description: "'America/Paramaribo' timezone",
                },
                {
                  value: 'America/Cayenne',
                  description: "'America/Cayenne' timezone",
                },
                {
                  value: 'America/Sitka',
                  description: "'America/Sitka' timezone",
                },
                {
                  value: 'America/Curacao',
                  description: "'America/Curacao' timezone",
                },
                {
                  value: 'America/Cambridge_Bay',
                  description: "'America/Cambridge_Bay' timezone",
                },
                {
                  value: 'America/Fortaleza',
                  description: "'America/Fortaleza' timezone",
                },
                {
                  value: 'America/Cancun',
                  description: "'America/Cancun' timezone",
                },
                {
                  value: 'America/Ojinaga',
                  description: "'America/Ojinaga' timezone",
                },
                {
                  value: 'America/Punta_Arenas',
                  description: "'America/Punta_Arenas' timezone",
                },
                {
                  value: 'America/Port-au-Prince',
                  description: "'America/Port-au-Prince' timezone",
                },
                {
                  value: 'America/Grand_Turk',
                  description: "'America/Grand_Turk' timezone",
                },
                {
                  value: 'America/Tegucigalpa',
                  description: "'America/Tegucigalpa' timezone",
                },
                {
                  value: 'America/La_Paz',
                  description: "'America/La_Paz' timezone",
                },
                {
                  value: 'America/Santiago',
                  description: "'America/Santiago' timezone",
                },
                {
                  value: 'America/Inuvik',
                  description: "'America/Inuvik' timezone",
                },
                {
                  value: 'America/Puerto_Rico',
                  description: "'America/Puerto_Rico' timezone",
                },
                {
                  value: 'America/Nuuk',
                  description: "'America/Nuuk' timezone",
                },
                {
                  value: 'MST7MDT',
                  description: "'MST7MDT' timezone",
                },
                {
                  value: 'PST8PDT',
                  description: "'PST8PDT' timezone",
                },
                {
                  value: 'Etc/UTC',
                  description: "'Etc/UTC' timezone",
                },
                {
                  value: 'CET',
                  description: "'CET' timezone",
                },
                {
                  value: 'Atlantic/Madeira',
                  description: "'Atlantic/Madeira' timezone",
                },
                {
                  value: 'Atlantic/Canary',
                  description: "'Atlantic/Canary' timezone",
                },
                {
                  value: 'Atlantic/Bermuda',
                  description: "'Atlantic/Bermuda' timezone",
                },
                {
                  value: 'Atlantic/Reykjavik',
                  description: "'Atlantic/Reykjavik' timezone",
                },
                {
                  value: 'Atlantic/Faroe',
                  description: "'Atlantic/Faroe' timezone",
                },
                {
                  value: 'Atlantic/Azores',
                  description: "'Atlantic/Azores' timezone",
                },
                {
                  value: 'Atlantic/South_Georgia',
                  description: "'Atlantic/South_Georgia' timezone",
                },
                {
                  value: 'Atlantic/Cape_Verde',
                  description: "'Atlantic/Cape_Verde' timezone",
                },
                {
                  value: 'Atlantic/Stanley',
                  description: "'Atlantic/Stanley' timezone",
                },
                {
                  value: 'WET',
                  description: "'WET' timezone",
                },
                {
                  value: 'Antarctica/Mawson',
                  description: "'Antarctica/Mawson' timezone",
                },
                {
                  value: 'Antarctica/Syowa',
                  description: "'Antarctica/Syowa' timezone",
                },
                {
                  value: 'Antarctica/Vostok',
                  description: "'Antarctica/Vostok' timezone",
                },
                {
                  value: 'Antarctica/Rothera',
                  description: "'Antarctica/Rothera' timezone",
                },
                {
                  value: 'Antarctica/Palmer',
                  description: "'Antarctica/Palmer' timezone",
                },
                {
                  value: 'Antarctica/Troll',
                  description: "'Antarctica/Troll' timezone",
                },
                {
                  value: 'Antarctica/Macquarie',
                  description: "'Antarctica/Macquarie' timezone",
                },
                {
                  value: 'Antarctica/Casey',
                  description: "'Antarctica/Casey' timezone",
                },
                {
                  value: 'Antarctica/DumontDUrville',
                  description: "'Antarctica/DumontDUrville' timezone",
                },
                {
                  value: 'Antarctica/Davis',
                  description: "'Antarctica/Davis' timezone",
                },
                {
                  value: 'Europe/Zurich',
                  description: "'Europe/Zurich' timezone",
                },
                {
                  value: 'Europe/Copenhagen',
                  description: "'Europe/Copenhagen' timezone",
                },
                {
                  value: 'Europe/Ulyanovsk',
                  description: "'Europe/Ulyanovsk' timezone",
                },
                {
                  value: 'Europe/Dublin',
                  description: "'Europe/Dublin' timezone",
                },
                {
                  value: 'Europe/Simferopol',
                  description: "'Europe/Simferopol' timezone",
                },
                {
                  value: 'Europe/Prague',
                  description: "'Europe/Prague' timezone",
                },
                {
                  value: 'Europe/Uzhgorod',
                  description: "'Europe/Uzhgorod' timezone",
                },
                {
                  value: 'Europe/Budapest',
                  description: "'Europe/Budapest' timezone",
                },
                {
                  value: 'Europe/Astrakhan',
                  description: "'Europe/Astrakhan' timezone",
                },
                {
                  value: 'Europe/Berlin',
                  description: "'Europe/Berlin' timezone",
                },
                {
                  value: 'Europe/Monaco',
                  description: "'Europe/Monaco' timezone",
                },
                {
                  value: 'Europe/Rome',
                  description: "'Europe/Rome' timezone",
                },
                {
                  value: 'Europe/Sofia',
                  description: "'Europe/Sofia' timezone",
                },
                {
                  value: 'Europe/Minsk',
                  description: "'Europe/Minsk' timezone",
                },
                {
                  value: 'Europe/Vilnius',
                  description: "'Europe/Vilnius' timezone",
                },
                {
                  value: 'Europe/Tirane',
                  description: "'Europe/Tirane' timezone",
                },
                {
                  value: 'Europe/Kiev',
                  description: "'Europe/Kiev' timezone",
                },
                {
                  value: 'Europe/Vienna',
                  description: "'Europe/Vienna' timezone",
                },
                {
                  value: 'Europe/Luxembourg',
                  description: "'Europe/Luxembourg' timezone",
                },
                {
                  value: 'Europe/Istanbul',
                  description: "'Europe/Istanbul' timezone",
                },
                {
                  value: 'Europe/Zaporozhye',
                  description: "'Europe/Zaporozhye' timezone",
                },
                {
                  value: 'Europe/Madrid',
                  description: "'Europe/Madrid' timezone",
                },
                {
                  value: 'Europe/Riga',
                  description: "'Europe/Riga' timezone",
                },
                {
                  value: 'Europe/Gibraltar',
                  description: "'Europe/Gibraltar' timezone",
                },
                {
                  value: 'Europe/Saratov',
                  description: "'Europe/Saratov' timezone",
                },
                {
                  value: 'Europe/Chisinau',
                  description: "'Europe/Chisinau' timezone",
                },
                {
                  value: 'Europe/Stockholm',
                  description: "'Europe/Stockholm' timezone",
                },
                {
                  value: 'Europe/Kaliningrad',
                  description: "'Europe/Kaliningrad' timezone",
                },
                {
                  value: 'Europe/Kirov',
                  description: "'Europe/Kirov' timezone",
                },
                {
                  value: 'Europe/Malta',
                  description: "'Europe/Malta' timezone",
                },
                {
                  value: 'Europe/Samara',
                  description: "'Europe/Samara' timezone",
                },
                {
                  value: 'Europe/Volgograd',
                  description: "'Europe/Volgograd' timezone",
                },
                {
                  value: 'Europe/Athens',
                  description: "'Europe/Athens' timezone",
                },
                {
                  value: 'Europe/Brussels',
                  description: "'Europe/Brussels' timezone",
                },
                {
                  value: 'Europe/Moscow',
                  description: "'Europe/Moscow' timezone",
                },
                {
                  value: 'Europe/Paris',
                  description: "'Europe/Paris' timezone",
                },
                {
                  value: 'Europe/Warsaw',
                  description: "'Europe/Warsaw' timezone",
                },
                {
                  value: 'Europe/Belgrade',
                  description: "'Europe/Belgrade' timezone",
                },
                {
                  value: 'Europe/Helsinki',
                  description: "'Europe/Helsinki' timezone",
                },
                {
                  value: 'Europe/London',
                  description: "'Europe/London' timezone",
                },
                {
                  value: 'Europe/Tallinn',
                  description: "'Europe/Tallinn' timezone",
                },
                {
                  value: 'Europe/Amsterdam',
                  description: "'Europe/Amsterdam' timezone",
                },
                {
                  value: 'Europe/Bucharest',
                  description: "'Europe/Bucharest' timezone",
                },
                {
                  value: 'Europe/Lisbon',
                  description: "'Europe/Lisbon' timezone",
                },
                {
                  value: 'Europe/Oslo',
                  description: "'Europe/Oslo' timezone",
                },
                {
                  value: 'Europe/Andorra',
                  description: "'Europe/Andorra' timezone",
                },
              ],
              default: 'America/Los_Angeles',
            },
          },
          {
            variable: 'nodeIP',
            description: 'LAN IP address of your TrueNAS server',
            group: 'Machinaris Configuration',
            label: 'Worker Address',
            schema: {
              type: 'string',
              $ref: [
                'definitions/nodeIP',
              ],
              default: '192.168.1.100',
            },
          },
          {
            variable: 'machinaris_ui_port',
            label: 'Machinaris Web UI',
            group: 'Networking',
            description: 'Web UI Port for Machinaris',
            schema: {
              type: 'int',
              min: 9000,
              max: 65535,
              default: 9003,
            },
          },
          {
            variable: 'machinarisApiPort',
            label: 'Machinaris API port',
            group: 'Networking',
            description: 'API port for Machinaris',
            schema: {
              editable: false,
              hidden: true,
              type: 'int',
              default: 8927,
            },
          },
          {
            variable: 'appVolumeMounts',
            label: 'Machinaris Storage',
            group: 'Storage',
            schema: {
              type: 'dict',
              attrs: [
                {
                  variable: 'config',
                  label: 'Configuration Volume',
                  schema: {
                    type: 'dict',
                    attrs: [
                      {
                        variable: 'datasetName',
                        label: 'Configuration Volume Dataset Name',
                        schema: {
                          type: 'string',
                          hidden: true,
                          $ref: [
                            'normalize/ixVolume',
                          ],
                          show_if: [
                            [
                              'hostPathEnabled',
                              '=',
                              false,
                            ],
                          ],
                          default: 'config',
                          editable: false,
                        },
                      },
                      {
                        variable: 'mountPath',
                        label: 'Configuration Mount Path',
                        description: 'Path where the volume will be mounted inside the pod',
                        schema: {
                          type: 'path',
                          hidden: true,
                          editable: true,
                          default: '/root/.chia',
                        },
                      },
                      {
                        variable: 'hostPathEnabled',
                        label: 'Enable Custom Host Path for Machinaris Configuration Volume',
                        schema: {
                          type: 'boolean',
                          default: false,
                          show_subquestions_if: true,
                          subquestions: [
                            {
                              variable: 'hostPath',
                              label: 'Host Path for Machinaris Configuration Volume',
                              schema: {
                                type: 'hostpath',
                                required: true,
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  variable: 'plots',
                  label: 'Plot Volume',
                  schema: {
                    type: 'dict',
                    attrs: [
                      {
                        variable: 'datasetName',
                        label: 'Plots Volume Name',
                        schema: {
                          type: 'string',
                          hidden: true,
                          $ref: [
                            'normalize/ixVolume',
                          ],
                          show_if: [
                            [
                              'hostPathEnabled',
                              '=',
                              false,
                            ],
                          ],
                          default: 'plots',
                          editable: false,
                        },
                      },
                      {
                        variable: 'mountPath',
                        label: 'Plots Mount Path',
                        description: 'Path where the volume will be mounted inside the pod',
                        schema: {
                          type: 'path',
                          hidden: true,
                          editable: false,
                          default: '/plots',
                        },
                      },
                      {
                        variable: 'hostPathEnabled',
                        label: 'Enable Custom Host Path for Machinaris Plots Volume',
                        schema: {
                          type: 'boolean',
                          default: false,
                          show_subquestions_if: true,
                          subquestions: [
                            {
                              variable: 'hostPath',
                              label: 'Host Path for Machinaris Plots Volume',
                              schema: {
                                type: 'hostpath',
                                required: true,
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
                {
                  variable: 'plotting',
                  label: 'Plotting Temp Volume',
                  schema: {
                    type: 'dict',
                    attrs: [
                      {
                        variable: 'datasetName',
                        label: 'Plotting Volume Name',
                        schema: {
                          type: 'string',
                          hidden: true,
                          $ref: [
                            'normalize/ixVolume',
                          ],
                          show_if: [
                            [
                              'hostPathEnabled',
                              '=',
                              false,
                            ],
                          ],
                          default: 'plotting',
                          editable: false,
                        },
                      },
                      {
                        variable: 'mountPath',
                        label: 'Plotting Mount Path',
                        description: 'Path where the volume will be mounted inside the pod',
                        schema: {
                          type: 'path',
                          hidden: true,
                          editable: false,
                          default: '/plotting',
                        },
                      },
                      {
                        variable: 'hostPathEnabled',
                        label: 'Enable Custom Host Path for Machinaris Plotting Temp Volume',
                        schema: {
                          type: 'boolean',
                          default: false,
                          show_subquestions_if: true,
                          subquestions: [
                            {
                              variable: 'hostPath',
                              label: 'Host Path for Machinaris Plotting Volume',
                              schema: {
                                type: 'hostpath',
                                required: true,
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            variable: 'extraAppVolumeMounts',
            label: 'Machinaris Extra Host Path Volumes',
            group: 'Storage',
            schema: {
              type: 'list',
              items: [
                {
                  variable: 'extraAppVolume',
                  label: 'Machinaris Host Path Volume',
                  description: 'Add an extra host path volume for machinaris application',
                  schema: {
                    type: 'dict',
                    attrs: [
                      {
                        variable: 'mountPath',
                        label: 'Mount Path in Pod',
                        description: 'Path where the volume will be mounted inside the pod',
                        schema: {
                          type: 'path',
                          required: true,
                        },
                      },
                      {
                        variable: 'hostPath',
                        label: 'Host Path',
                        description: 'Host path',
                        schema: {
                          type: 'hostpath',
                          required: true,
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            variable: 'environmentVariables',
            label: 'Environment Variables for Machinaris',
            group: 'Machinaris Environment Variables',
            schema: {
              type: 'list',
              default: [

              ],
              items: [
                {
                  variable: 'environmentVariable',
                  label: 'Environment Variable',
                  schema: {
                    type: 'dict',
                    attrs: [
                      {
                        variable: 'name',
                        label: 'Name',
                        schema: {
                          type: 'string',
                        },
                      },
                      {
                        variable: 'value',
                        label: 'Value',
                        schema: {
                          type: 'string',
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            variable: 'enableResourceLimits',
            label: 'Enable Pod resource limits',
            group: 'Resource Limits',
            schema: {
              type: 'boolean',
            },
          },
          {
            variable: 'cpuLimit',
            label: 'CPU limit',
            group: 'Resource Limits',
            schema: {
              type: 'string',
              show_if: [
                [
                  'enableResourceLimits',
                  '=',
                  true,
                ],
              ],
              valid_chars: '^\\d+(?:\\.\\d+(?!.*m$)|m?$)',
            },
          },
          {
            variable: 'memLimit',
            label: 'Memory limit',
            group: 'Resource Limits',
            schema: {
              type: 'string',
              show_if: [
                [
                  'enableResourceLimits',
                  '=',
                  true,
                ],
              ],
              valid_chars: '^([+-]?[0-9.]+)([eEinumkKMGTP]*[-+]?[0-9]*)$',
            },
          },
          {
            variable: 'cactusEnabled',
            label: 'Enable Cactus',
            group: 'Configure Coins',
            schema: {
              type: 'boolean',
              default: false,
              show_subquestions_if: true,
              subquestions: [
                {
                  variable: 'cactus',
                  label: 'Configure Cactus',
                  schema: {
                    type: 'dict',
                    additional_attrs: true,
                    attrs: [
                      {
                        variable: 'volumeMounts',
                        label: 'Storage Configurations',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'config',
                              label: 'Configuration Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Configuration Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'cactus-config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Configuration Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia',
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Configuration Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Configuration Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              variable: 'mnemonic',
                              label: 'Mnemonic Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Mnemonic Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Mnemonic Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia/mnemonic.txt',
                                    },
                                  },
                                  {
                                    variable: 'subPath',
                                    label: 'Subpath in the Dataset',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'mnemonic.txt',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'readOnly',
                                    label: 'Mode',
                                    description: 'Mnemonic file mode',
                                    schema: {
                                      type: 'boolean',
                                      hidden: true,
                                      editable: false,
                                      default: true,
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Mnemonic Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Mnemonic Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        variable: 'environmentVariables',
                        label: 'Environment Variables',
                        schema: {
                          type: 'list',
                          default: [

                          ],
                          items: [
                            {
                              variable: 'environmentVariable',
                              label: 'Environment Variable',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'name',
                                    label: 'Name',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                  {
                                    variable: 'value',
                                    label: 'Value',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            variable: 'chivesEnabled',
            label: 'Enable Chives',
            group: 'Configure Coins',
            schema: {
              type: 'boolean',
              default: false,
              show_subquestions_if: true,
              subquestions: [
                {
                  variable: 'chives',
                  label: 'Configure Chives',
                  schema: {
                    type: 'dict',
                    additional_attrs: true,
                    attrs: [
                      {
                        variable: 'volumeMounts',
                        label: 'Storage Configurations',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'config',
                              label: 'Configuration Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Configuration Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'chives-config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Configuration Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia',
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Configuration Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Configuration Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              variable: 'mnemonic',
                              label: 'Mnemonic Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Mnemonic Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Mnemonic Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia/mnemonic.txt',
                                    },
                                  },
                                  {
                                    variable: 'subPath',
                                    label: 'Subpath in the Dataset',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'mnemonic.txt',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'readOnly',
                                    label: 'Mode',
                                    description: 'Mnemonic file mode',
                                    schema: {
                                      type: 'boolean',
                                      hidden: true,
                                      editable: false,
                                      default: true,
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Mnemonic Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Mnemonic Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        variable: 'environmentVariables',
                        label: 'Environment Variables',
                        schema: {
                          type: 'list',
                          default: [

                          ],
                          items: [
                            {
                              variable: 'environmentVariable',
                              label: 'Environment Variable',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'name',
                                    label: 'Name',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                  {
                                    variable: 'value',
                                    label: 'Value',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            variable: 'cryptodogeEnabled',
            label: 'Enable Cryptodoge',
            group: 'Configure Coins',
            schema: {
              type: 'boolean',
              default: false,
              show_subquestions_if: true,
              subquestions: [
                {
                  variable: 'cryptodoge',
                  label: 'Configure Cryptodoge',
                  schema: {
                    type: 'dict',
                    additional_attrs: true,
                    attrs: [
                      {
                        variable: 'volumeMounts',
                        label: 'Storage Configurations',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'config',
                              label: 'Configuration Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Configuration Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'cryptodoge-config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Configuration Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia',
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Configuration Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Configuration Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              variable: 'mnemonic',
                              label: 'Mnemonic Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Mnemonic Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Mnemonic Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia/mnemonic.txt',
                                    },
                                  },
                                  {
                                    variable: 'subPath',
                                    label: 'Subpath in the Dataset',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'mnemonic.txt',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'readOnly',
                                    label: 'Mode',
                                    description: 'Mnemonic file mode',
                                    schema: {
                                      type: 'boolean',
                                      hidden: true,
                                      editable: false,
                                      default: true,
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Mnemonic Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Mnemonic Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        variable: 'environmentVariables',
                        label: 'Environment Variables',
                        schema: {
                          type: 'list',
                          default: [

                          ],
                          items: [
                            {
                              variable: 'environmentVariable',
                              label: 'Environment Variable',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'name',
                                    label: 'Name',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                  {
                                    variable: 'value',
                                    label: 'Value',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            variable: 'flaxEnabled',
            label: 'Enable Flax',
            group: 'Configure Coins',
            schema: {
              type: 'boolean',
              default: false,
              show_subquestions_if: true,
              subquestions: [
                {
                  variable: 'flax',
                  label: 'Configure Flax',
                  schema: {
                    type: 'dict',
                    additional_attrs: true,
                    attrs: [
                      {
                        variable: 'volumeMounts',
                        label: 'Storage Configurations',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'config',
                              label: 'Configuration Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Configuration Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'flax-config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Configuration Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia',
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Configuration Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Configuration Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              variable: 'mnemonic',
                              label: 'Mnemonic Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Mnemonic Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Mnemonic Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia/mnemonic.txt',
                                    },
                                  },
                                  {
                                    variable: 'subPath',
                                    label: 'Subpath in the Dataset',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'mnemonic.txt',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'readOnly',
                                    label: 'Mode',
                                    description: 'Mnemonic file mode',
                                    schema: {
                                      type: 'boolean',
                                      hidden: true,
                                      editable: false,
                                      default: true,
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Mnemonic Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Mnemonic Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        variable: 'environmentVariables',
                        label: 'Environment Variables',
                        schema: {
                          type: 'list',
                          default: [

                          ],
                          items: [
                            {
                              variable: 'environmentVariable',
                              label: 'Environment Variable',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'name',
                                    label: 'Name',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                  {
                                    variable: 'value',
                                    label: 'Value',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            variable: 'floraEnabled',
            label: 'Enable Flora',
            group: 'Configure Coins',
            schema: {
              type: 'boolean',
              default: false,
              show_subquestions_if: true,
              subquestions: [
                {
                  variable: 'flora',
                  label: 'Configure Flora',
                  schema: {
                    type: 'dict',
                    additional_attrs: true,
                    attrs: [
                      {
                        variable: 'volumeMounts',
                        label: 'Storage Configurations',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'config',
                              label: 'Configuration Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Configuration Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'flora-config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Configuration Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia',
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Configuration Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Configuration Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              variable: 'mnemonic',
                              label: 'Mnemonic Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Mnemonic Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Mnemonic Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia/mnemonic.txt',
                                    },
                                  },
                                  {
                                    variable: 'subPath',
                                    label: 'Subpath in the Dataset',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'mnemonic.txt',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'readOnly',
                                    label: 'Mode',
                                    description: 'Mnemonic file mode',
                                    schema: {
                                      type: 'boolean',
                                      hidden: true,
                                      editable: false,
                                      default: true,
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Mnemonic Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Mnemonic Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        variable: 'environmentVariables',
                        label: 'Environment Variables',
                        schema: {
                          type: 'list',
                          default: [

                          ],
                          items: [
                            {
                              variable: 'environmentVariable',
                              label: 'Environment Variable',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'name',
                                    label: 'Name',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                  {
                                    variable: 'value',
                                    label: 'Value',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            variable: 'hddcoinEnabled',
            label: 'Enable HDDCoin',
            group: 'Configure Coins',
            schema: {
              type: 'boolean',
              default: false,
              show_subquestions_if: true,
              subquestions: [
                {
                  variable: 'hddcoin',
                  label: 'Configure HDDCoin',
                  schema: {
                    type: 'dict',
                    additional_attrs: true,
                    attrs: [
                      {
                        variable: 'volumeMounts',
                        label: 'Storage Configurations',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'config',
                              label: 'Configuration Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Configuration Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'hddcoin-config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Configuration Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia',
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Configuration Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Configuration Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              variable: 'mnemonic',
                              label: 'Mnemonic Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Mnemonic Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Mnemonic Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia/mnemonic.txt',
                                    },
                                  },
                                  {
                                    variable: 'subPath',
                                    label: 'Subpath in the Dataset',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'mnemonic.txt',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'readOnly',
                                    label: 'Mode',
                                    description: 'Mnemonic file mode',
                                    schema: {
                                      type: 'boolean',
                                      hidden: true,
                                      editable: false,
                                      default: true,
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Mnemonic Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Mnemonic Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        variable: 'environmentVariables',
                        label: 'Environment Variables',
                        schema: {
                          type: 'list',
                          default: [

                          ],
                          items: [
                            {
                              variable: 'environmentVariable',
                              label: 'Environment Variable',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'name',
                                    label: 'Name',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                  {
                                    variable: 'value',
                                    label: 'Value',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            variable: 'maizeEnabled',
            label: 'Enable Maize',
            group: 'Configure Coins',
            schema: {
              type: 'boolean',
              default: false,
              show_subquestions_if: true,
              subquestions: [
                {
                  variable: 'maize',
                  label: 'Configure Maize',
                  schema: {
                    type: 'dict',
                    additional_attrs: true,
                    attrs: [
                      {
                        variable: 'volumeMounts',
                        label: 'Storage Configurations',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'config',
                              label: 'Configuration Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Configuration Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'maize-config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Configuration Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia',
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Configuration Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Configuration Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              variable: 'mnemonic',
                              label: 'Mnemonic Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Mnemonic Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Mnemonic Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia/mnemonic.txt',
                                    },
                                  },
                                  {
                                    variable: 'subPath',
                                    label: 'Subpath in the Dataset',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'mnemonic.txt',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'readOnly',
                                    label: 'Mode',
                                    description: 'Mnemonic file mode',
                                    schema: {
                                      type: 'boolean',
                                      hidden: true,
                                      editable: false,
                                      default: true,
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Mnemonic Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Mnemonic Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        variable: 'environmentVariables',
                        label: 'Environment Variables',
                        schema: {
                          type: 'list',
                          default: [

                          ],
                          items: [
                            {
                              variable: 'environmentVariable',
                              label: 'Environment Variable',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'name',
                                    label: 'Name',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                  {
                                    variable: 'value',
                                    label: 'Value',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            variable: 'nchainEnabled',
            label: 'Enable N-Chain',
            group: 'Configure Coins',
            schema: {
              type: 'boolean',
              default: false,
              show_subquestions_if: true,
              subquestions: [
                {
                  variable: 'nchain',
                  label: 'Configure N-Chain',
                  schema: {
                    type: 'dict',
                    additional_attrs: true,
                    attrs: [
                      {
                        variable: 'volumeMounts',
                        label: 'Storage Configurations',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'config',
                              label: 'Configuration Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Configuration Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'nchain-config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Configuration Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia',
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Configuration Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Configuration Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              variable: 'mnemonic',
                              label: 'Mnemonic Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Mnemonic Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Mnemonic Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia/mnemonic.txt',
                                    },
                                  },
                                  {
                                    variable: 'subPath',
                                    label: 'Subpath in the Dataset',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'mnemonic.txt',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'readOnly',
                                    label: 'Mode',
                                    description: 'Mnemonic file mode',
                                    schema: {
                                      type: 'boolean',
                                      hidden: true,
                                      editable: false,
                                      default: true,
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Mnemonic Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Mnemonic Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        variable: 'environmentVariables',
                        label: 'Environment Variables',
                        schema: {
                          type: 'list',
                          default: [

                          ],
                          items: [
                            {
                              variable: 'environmentVariable',
                              label: 'Environment Variable',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'name',
                                    label: 'Name',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                  {
                                    variable: 'value',
                                    label: 'Value',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            variable: 'staicoinEnabled',
            label: 'Enable Staicoin',
            group: 'Configure Coins',
            schema: {
              type: 'boolean',
              default: false,
              show_subquestions_if: true,
              subquestions: [
                {
                  variable: 'staicoin',
                  label: 'Configure Staicoin',
                  schema: {
                    type: 'dict',
                    additional_attrs: true,
                    attrs: [
                      {
                        variable: 'volumeMounts',
                        label: 'Storage Configurations',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'config',
                              label: 'Configuration Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Configuration Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'staicoin-config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Configuration Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia',
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Configuration Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Configuration Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              variable: 'mnemonic',
                              label: 'Mnemonic Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Mnemonic Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Mnemonic Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia/mnemonic.txt',
                                    },
                                  },
                                  {
                                    variable: 'subPath',
                                    label: 'Subpath in the Dataset',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'mnemonic.txt',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'readOnly',
                                    label: 'Mode',
                                    description: 'Mnemonic file mode',
                                    schema: {
                                      type: 'boolean',
                                      hidden: true,
                                      editable: false,
                                      default: true,
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Mnemonic Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Mnemonic Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        variable: 'environmentVariables',
                        label: 'Environment Variables',
                        schema: {
                          type: 'list',
                          default: [

                          ],
                          items: [
                            {
                              variable: 'environmentVariable',
                              label: 'Environment Variable',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'name',
                                    label: 'Name',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                  {
                                    variable: 'value',
                                    label: 'Value',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            variable: 'storEnabled',
            label: 'Enable Stor',
            group: 'Configure Coins',
            schema: {
              type: 'boolean',
              default: false,
              show_subquestions_if: true,
              subquestions: [
                {
                  variable: 'stor',
                  label: 'Configure Stor',
                  schema: {
                    type: 'dict',
                    additional_attrs: true,
                    attrs: [
                      {
                        variable: 'volumeMounts',
                        label: 'Storage Configurations',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'config',
                              label: 'Configuration Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Configuration Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'stor-config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Configuration Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia',
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Configuration Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Configuration Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              variable: 'mnemonic',
                              label: 'Mnemonic Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Mnemonic Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Mnemonic Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia/mnemonic.txt',
                                    },
                                  },
                                  {
                                    variable: 'subPath',
                                    label: 'Subpath in the Dataset',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'mnemonic.txt',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'readOnly',
                                    label: 'Mode',
                                    description: 'Mnemonic file mode',
                                    schema: {
                                      type: 'boolean',
                                      hidden: true,
                                      editable: false,
                                      default: true,
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Mnemonic Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Mnemonic Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        variable: 'environmentVariables',
                        label: 'Environment Variables',
                        schema: {
                          type: 'list',
                          default: [

                          ],
                          items: [
                            {
                              variable: 'environmentVariable',
                              label: 'Environment Variable',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'name',
                                    label: 'Name',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                  {
                                    variable: 'value',
                                    label: 'Value',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            variable: 'btcgreenEnabled',
            label: 'Enable BTCGreen',
            group: 'Configure Coins',
            schema: {
              type: 'boolean',
              default: false,
              show_subquestions_if: true,
              subquestions: [
                {
                  variable: 'btcgreen',
                  label: 'Configure BTCGreen',
                  schema: {
                    type: 'dict',
                    additional_attrs: true,
                    attrs: [
                      {
                        variable: 'volumeMounts',
                        label: 'Storage Configurations',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'config',
                              label: 'Configuration Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Configuration Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'btcgreen-config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Configuration Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia',
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Configuration Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Configuration Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              variable: 'mnemonic',
                              label: 'Mnemonic Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Mnemonic Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Mnemonic Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia/mnemonic.txt',
                                    },
                                  },
                                  {
                                    variable: 'subPath',
                                    label: 'Subpath in the Dataset',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'mnemonic.txt',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'readOnly',
                                    label: 'Mode',
                                    description: 'Mnemonic file mode',
                                    schema: {
                                      type: 'boolean',
                                      hidden: true,
                                      editable: false,
                                      default: true,
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Mnemonic Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Mnemonic Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        variable: 'environmentVariables',
                        label: 'Environment Variables',
                        schema: {
                          type: 'list',
                          default: [

                          ],
                          items: [
                            {
                              variable: 'environmentVariable',
                              label: 'Environment Variable',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'name',
                                    label: 'Name',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                  {
                                    variable: 'value',
                                    label: 'Value',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          {
            variable: 'shibgreenEnabled',
            label: 'Enable Shibgreen',
            group: 'Configure Coins',
            schema: {
              type: 'boolean',
              default: false,
              show_subquestions_if: true,
              subquestions: [
                {
                  variable: 'shibgreen',
                  label: 'Configure Shibgreen',
                  schema: {
                    type: 'dict',
                    additional_attrs: true,
                    attrs: [
                      {
                        variable: 'volumeMounts',
                        label: 'Storage Configurations',
                        schema: {
                          type: 'dict',
                          attrs: [
                            {
                              variable: 'config',
                              label: 'Configuration Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Configuration Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'shibgreen-config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Configuration Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia',
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Configuration Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Configuration Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                            {
                              variable: 'mnemonic',
                              label: 'Mnemonic Volume',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'datasetName',
                                    label: 'Mnemonic Volume Dataset Name',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      $ref: [
                                        'normalize/ixVolume',
                                      ],
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'config',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'mountPath',
                                    label: 'Mnemonic Mount Path',
                                    description: 'Path where the volume will be mounted inside the pod',
                                    schema: {
                                      type: 'path',
                                      hidden: true,
                                      editable: false,
                                      default: '/root/.chia/mnemonic.txt',
                                    },
                                  },
                                  {
                                    variable: 'subPath',
                                    label: 'Subpath in the Dataset',
                                    schema: {
                                      type: 'string',
                                      hidden: true,
                                      show_if: [
                                        [
                                          'hostPathEnabled',
                                          '=',
                                          false,
                                        ],
                                      ],
                                      default: 'mnemonic.txt',
                                      editable: false,
                                    },
                                  },
                                  {
                                    variable: 'readOnly',
                                    label: 'Mode',
                                    description: 'Mnemonic file mode',
                                    schema: {
                                      type: 'boolean',
                                      hidden: true,
                                      editable: false,
                                      default: true,
                                    },
                                  },
                                  {
                                    variable: 'hostPathEnabled',
                                    label: 'Enable Custom Host Path for Mnemonic Volume',
                                    schema: {
                                      type: 'boolean',
                                      default: false,
                                      show_subquestions_if: true,
                                      subquestions: [
                                        {
                                          variable: 'hostPath',
                                          label: 'Host Path for Mnemonic Volume',
                                          schema: {
                                            type: 'hostpath',
                                            required: true,
                                          },
                                        },
                                      ],
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        variable: 'environmentVariables',
                        label: 'Environment Variables',
                        schema: {
                          type: 'list',
                          default: [

                          ],
                          items: [
                            {
                              variable: 'environmentVariable',
                              label: 'Environment Variable',
                              schema: {
                                type: 'dict',
                                attrs: [
                                  {
                                    variable: 'name',
                                    label: 'Name',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                  {
                                    variable: 'value',
                                    label: 'Value',
                                    schema: {
                                      type: 'string',
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
      app_readme: "<h1>Machinaris</h1>\n<p><a href=\"https://github.com/guydavis/machinaris\">MACHINARIS</a> is an easy-to-use WebUI for Chia plotting and farming. This includes Chia, Plotman, MadMax, Chiadog under main node along with various coin-forks which can be enabled conditionally.</p>\n<p>Coins include Cactus, Chives, CrypoDoge, Flax, Flora, HDDCoin, Maize, NChain, StaiCoin, Stor, BTCGreen and Shibgreen.</p>\n<h1>Machinaris Defaults</h1>\n<p>This section contains information about the defaults of Machinaris application for visibility.</p>\n<h2>1. Environment Variables</h2>\n<p>Following are the default environment variables for Machinaris main node and the coin forks.</p>\n<h3>Machinaris Node</h3>\n<p>Machinaris main node comes with following default environment variables:</p>\n<p>| Variable         | Default Value                                         | Description           |\n| ---------------- | ----------------------------------------------------- | --------------------- |\n|   TZ             |  Same as to User selected Timezone                    | Timezone information  |\n|   worker_address |  Same as to LAN IP address                            | Worker Address        |\n|   blockchains    |  chia                                                 | Block Chain            |\n|   plots_dir      |  Same as to User selected plots volume                | Plots Directory       |\n|   mode           |  fullnode                                             | Machinaris Mode       |</p>\n<p>These values can be overridden while configuring Machinaris application.</p>\n<h3>Coin Forks</h3>\n<p>Coin forks also come with a set of default environment variables:</p>\n<p>| Variable         | Default Value                                         | Description           |\n| ---------------- | ----------------------------------------------------- | --------------------- |\n|   TZ             |  Same as to User selected Timezone                    | Timezone information  |\n|   worker_address |  Same as to LAN IP address                            | Worker Address        |\n|   blockchains    |  chia                                                 | BlockChain            |\n|   plots_dir      |  Same as to User selected plots volume                | Plots Directory       |\n|   mode           |  fullnode                                             | Machinaris Mode       |\n|   controller_host|  Same as to LAN IP address                            | Controller Host       |\n|   worker_api_port|  Coin's Workload REST API Port                        | Worker API Port       |</p>\n<p>These defaults can be overridden for each coin fork when you enable them through Machinaris application configuration.</p>\n<h2>2. Volumes</h2>\n<p>Before getting to defaults, please take the following note:</p>\n<blockquote>\n<p>If Custom Host Path is not enabled for a Volume Configuration then, application will use ix-volumes and create datasets inside for Host Path by default.</p>\n<p>The path for ix-volumes has the following composition:\n<code>/mnt/&lt;pool_name&gt;/ix-applications/releases/&lt;application_name&gt;/volumes/ix-volumes/</code>\nAnd with the dataset inside, would be like:\n<code>/mnt/&lt;pool_name&gt;/ix-applications/releases/&lt;application_name&gt;/volumes/ix-volumes/&gt;&lt;dataset_name&gt;</code></p>\n<p>Following are the Volume Configurations for Machinaris main node &amp; the coin-forks by default:</p>\n</blockquote>\n<p>| Volume                 | hostPath (default value)                              | mountPath in container  |   Description                                   |\n| ---------------------- | ----------------------------------------------------- | ----------------------- | ----------------------------------------------- |\n|   <code>config</code>             |  <code>&lt;ix-volumes&gt;/config</code>                                | <code>/root/.chia</code>           | Chia config for main node                       |\n|   <code>plots</code>              |  <code>&lt;ix-volumes&gt;/plots</code>                                 | <code>/plots</code>                | Plots volume for main node &amp; coin forks         |\n|   <code>plotting</code>           |  <code>&lt;ix-volumes&gt;/plotting</code>                              | <code>/plotting</code>             | Plotting temp volume for main node &amp; coin forks |\n|   <code>&lt;coinName&gt;-config</code>  |  <code>&lt;ix-volumes&gt;/&lt;coinName&gt;-config</code>                     | <code>/root/.chia</code>           | Chia config for each of the coin-fork containers|</p>\n<p>Where <code>&lt;ix-volumes&gt;</code> is <code>/mnt/&lt;pool_name&gt;/ix-applications/releases/&lt;application_name&gt;/volumes/ix_volumes/</code> and <code>&lt;coinName&gt;</code> is one of the following: <code>[ cactus, chives, crypodoge, flax, flora, hddcoin, maize, nchain, staicoin, stor, btcgreen, shibgreen ]</code>.</p>",
      detailed_readme: "<h1>Machinaris</h1>\n<p><a href=\"https://github.com/guydavis/machinaris\">MACHINARIS</a> is an easy-to-use WebUI for Chia plotting and farming. This includes Chia, Plotman, MadMax, Chiadog under main node along with various coin-forks which can be enabled conditionally.</p>\n<p>Coins include Cactus, Chives, CrypoDoge, Flax, Flora, HDDCoin, Maize, NChain, StaiCoin, Stor, BTCGreen and Shibgreen.</p>\n<h2>Introduction</h2>\n<p>This chart bootstraps MACHINARIS deployment on a <a href=\"http://kubernetes.io\">Kubernetes</a> cluster using the <a href=\"https://helm.sh\">Helm</a> package manager.</p>\n<h1>Machinaris Defaults</h1>\n<p>This section contains information about the defaults of Machinaris application for visibility.</p>\n<h2>1. Environment Variables</h2>\n<p>Following are the default environment variables for Machinaris main node and the coin forks.</p>\n<h3>Machinaris Node</h3>\n<p>Machinaris main node comes with following default environment variables:</p>\n<p>| Variable         | Default Value                                         | Description           |\n| ---------------- | ----------------------------------------------------- | --------------------- |\n|   TZ             |  Same as to User selected Timezone                    | Timezone information  |\n|   worker_address |  Same as to LAN IP address                            | Worker Address        |\n|   blockchains    |  chia                                                 | Block Chain            |\n|   plots_dir      |  Same as to User selected plots volume                | Plots Directory       |\n|   mode           |  fullnode                                             | Machinaris Mode       |</p>\n<p>These values can be overridden while configuring Machinaris application.</p>\n<h3>Coin Forks</h3>\n<p>Coin forks also come with a set of default environment variables:</p>\n<p>| Variable         | Default Value                                         | Description           |\n| ---------------- | ----------------------------------------------------- | --------------------- |\n|   TZ             |  Same as to User selected Timezone                    | Timezone information  |\n|   worker_address |  Same as to LAN IP address                            | Worker Address        |\n|   blockchains    |  chia                                                 | BlockChain            |\n|   plots_dir      |  Same as to User selected plots volume                | Plots Directory       |\n|   mode           |  fullnode                                             | Machinaris Mode       |\n|   controller_host|  Same as to LAN IP address                            | Controller Host       |\n|   worker_api_port|  Coin's Workload REST API Port                        | Worker API Port       |</p>\n<p>These defaults can be overridden for each coin fork when you enable them through Machinaris application configuration.</p>\n<h2>2. Volumes</h2>\n<p>Before getting to defaults, please take the following note:</p>\n<blockquote>\n<p>If Custom Host Path is not enabled for a Volume Configuration then, application will use ix-volumes and create datasets inside for Host Path by default.</p>\n<p>The path for ix-volumes has the following composition:\n<code>/mnt/&lt;pool_name&gt;/ix-applications/releases/&lt;application_name&gt;/volumes/ix-volumes/</code>\nAnd with the dataset inside, would be like:\n<code>/mnt/&lt;pool_name&gt;/ix-applications/releases/&lt;application_name&gt;/volumes/ix-volumes/&gt;&lt;dataset_name&gt;</code></p>\n<p>Following are the Volume Configurations for Machinaris main node &amp; the coin-forks by default:</p>\n</blockquote>\n<p>| Volume                 | hostPath (default value)                              | mountPath in container  |   Description                                   |\n| ---------------------- | ----------------------------------------------------- | ----------------------- | ----------------------------------------------- |\n|   <code>config</code>             |  <code>&lt;ix-volumes&gt;/config</code>                                | <code>/root/.chia</code>           | Chia config for main node                       |\n|   <code>plots</code>              |  <code>&lt;ix-volumes&gt;/plots</code>                                 | <code>/plots</code>                | Plots volume for main node &amp; coin forks         |\n|   <code>plotting</code>           |  <code>&lt;ix-volumes&gt;/plotting</code>                              | <code>/plotting</code>             | Plotting temp volume for main node &amp; coin forks |\n|   <code>&lt;coinName&gt;-config</code>  |  <code>&lt;ix-volumes&gt;/&lt;coinName&gt;-config</code>                     | <code>/root/.chia</code>           | Chia config for each of the coin-fork containers|</p>\n<p>Where <code>&lt;ix-volumes&gt;</code> is <code>/mnt/&lt;pool_name&gt;/ix-applications/releases/&lt;application_name&gt;/volumes/ix_volumes/</code> and <code>&lt;coinName&gt;</code> is one of the following: <code>[ cactus, chives, crypodoge, flax, flora, hddcoin, maize, nchain, staicoin, stor, btcgreen, shibgreen ]</code>.</p>",
      changelog: null,
      supported: true,
      values: {
        timezone: 'America/Los_Angeles',
        nodeIP: '192.168.1.100',
        machinaris_ui_port: 9003,
        machinarisApiPort: 8927,
        appVolumeMounts: {
          config: {
            datasetName: 'config',
            mountPath: '/root/.chia',
            hostPathEnabled: false,
          },
          plots: {
            datasetName: 'plots',
            mountPath: '/plots',
            hostPathEnabled: false,
          },
          plotting: {
            datasetName: 'plotting',
            mountPath: '/plotting',
            hostPathEnabled: false,
          },
        },
        extraAppVolumeMounts: [

        ],
        environmentVariables: [

        ],
        cactusEnabled: false,
        chivesEnabled: false,
        cryptodogeEnabled: false,
        flaxEnabled: false,
        floraEnabled: false,
        hddcoinEnabled: false,
        maizeEnabled: false,
        nchainEnabled: false,
        staicoinEnabled: false,
        storEnabled: false,
        btcgreenEnabled: false,
        shibgreenEnabled: false,
      },
      human_version: 'v0.7.1_1.1.4',
    },
  } as any;

  const createComponent = createComponentFactory({
    component: ChartFormComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockWebsocket([
        mockCall('chart.release.create'),
        mockCall('chart.release.update'),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockDialogRef),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows values for an existing data when form is opened for create', () => {
    spectator.component.setChartCreate(existingChartCreate);
    const values = spectator.component.form.value;

    expect(values).toEqual({
      appVolumeMounts: {
        data: {
          datasetName: 'ix-ipfs-data',
          hostPathEnabled: false,
          mountPath: '/data/ipfs',
        },
        staging: {
          datasetName: 'ix-ipfs-staging',
          hostPathEnabled: false,
          mountPath: '/export',
        },
      },
      dnsConfig: {
        options: [],
      },
      environmentVariables: [],
      release_name: '',
      service: {
        apiPort: 9501,
        gatewayPort: 9880,
        swarmPort: 9401,
      },
      updateStrategy: 'Recreate',
      version: '1.2.1',
    });
  });

  it('creating when form is submitted', () => {
    spectator.component.setChartCreate(existingChartCreate);

    spectator.component.form.patchValue({
      release_name: 'app_name',
      service: {
        apiPort: 9599,
        gatewayPort: 9888,
        swarmPort: 9477,
      },
    });

    spectator.component.onSubmit();

    expect(spectator.component.dialogRef.componentInstance.setCall).toHaveBeenCalledWith(
      'chart.release.create', [{
        catalog: 'OFFICIAL',
        item: 'ipfs',
        release_name: 'app_name',
        train: 'charts',
        values: {
          appVolumeMounts: {
            data: {
              datasetName: 'ix-ipfs-data',
              hostPathEnabled: false,
              mountPath: '/data/ipfs',
            },
            staging: {
              datasetName: 'ix-ipfs-staging',
              hostPathEnabled: false,
              mountPath: '/export',
            },
          },
          dnsConfig: {
            options: [],
          },
          environmentVariables: [],
          release_name: 'app_name',
          service: {
            apiPort: 9599,
            gatewayPort: 9888,
            swarmPort: 9477,
          },
          updateStrategy: 'Recreate',
        },
        version: '1.2.1',
      }],
    );
  });

  it('shows values for an existing data when form is opened for edit', () => {
    spectator.component.setChartEdit(existingChartEdit);
    const values = spectator.component.form.value;

    expect(values).toEqual({
      appVolumeMounts: {
        config: {
          datasetName: 'config',
          hostPathEnabled: false,
          mountPath: '/root/.chia',
        },
        plots: {
          datasetName: 'plots',
          hostPathEnabled: false,
          mountPath: '/plots',
        },
        plotting: {
          datasetName: 'plotting',
          hostPathEnabled: false,
          mountPath: '/plotting',
        },
      },
      btcgreenEnabled: false,
      cactusEnabled: false,
      chivesEnabled: false,
      cpuLimit: '123',
      cryptodogeEnabled: false,
      enableResourceLimits: true,
      environmentVariables: [],
      extraAppVolumeMounts: [],
      flaxEnabled: false,
      floraEnabled: false,
      hddcoinEnabled: false,
      machinarisApiPort: 8927,
      machinaris_ui_port: 9003,
      maize: {
        environmentVariables: [
          {
            name: 'name1',
            value: 'value2',
          },
          {
            name: 'name1',
            value: 'value2',
          },
        ],
        volumeMounts: {
          config: {
            datasetName: 'maize-config',
            hostPath: '/mnt/my pool',
            hostPathEnabled: true,
            mountPath: '/root/.chia',
          },
          mnemonic: {
            datasetName: 'config',
            hostPathEnabled: false,
            mountPath: '/root/.chia/mnemonic.txt',
            readOnly: true,
            subPath: 'mnemonic.txt',
          },
        },
      },
      maizeEnabled: true,
      memLimit: '1234',
      nchainEnabled: false,
      nodeIP: '192.168.1.100',
      release_name: 'app_name',
      shibgreenEnabled: false,
      staicoinEnabled: false,
      storEnabled: false,
      timezone: 'America/Los_Angeles',
    });
  });

  it('editing when form is submitted', () => {
    spectator.component.setChartEdit(existingChartEdit);

    spectator.component.form.patchValue({
      memLimit: '555',
      timezone: 'Europe/Paris',
      cryptodogeEnabled: true,
    });

    spectator.component.onSubmit();

    expect(spectator.component.dialogRef.componentInstance.setCall).toHaveBeenCalledWith(
      'chart.release.update', ['app_name', {
        values: {
          appVolumeMounts: {
            config: {
              datasetName: 'config',
              hostPathEnabled: false,
              mountPath: '/root/.chia',
            },
            plots: {
              datasetName: 'plots',
              hostPathEnabled: false,
              mountPath: '/plots',
            },
            plotting: {
              datasetName: 'plotting',
              hostPathEnabled: false,
              mountPath: '/plotting',
            },
          },
          btcgreenEnabled: false,
          cactusEnabled: false,
          chivesEnabled: false,
          cpuLimit: '123',
          cryptodoge: {
            environmentVariables: [],
            volumeMounts: {
              config: {
                datasetName: 'cryptodoge-config',
                hostPathEnabled: false,
                mountPath: '/root/.chia',
              },
              mnemonic: {
                datasetName: 'config',
                hostPathEnabled: false,
                mountPath: '/root/.chia/mnemonic.txt',
                readOnly: true,
                subPath: 'mnemonic.txt',
              },
            },
          },
          cryptodogeEnabled: true,
          enableResourceLimits: true,
          environmentVariables: [],
          extraAppVolumeMounts: [],
          flaxEnabled: false,
          floraEnabled: false,
          hddcoinEnabled: false,
          machinarisApiPort: 8927,
          machinaris_ui_port: 9003,
          maize: {
            environmentVariables: [
              {
                name: 'name1',
                value: 'value2',
              },
              {
                name: 'name1',
                value: 'value2',
              },
            ],
            volumeMounts: {
              config: {
                datasetName: 'maize-config',
                hostPath: '/mnt/my pool',
                hostPathEnabled: true,
                mountPath: '/root/.chia',
              },
              mnemonic: {
                datasetName: 'config',
                hostPathEnabled: false,
                mountPath: '/root/.chia/mnemonic.txt',
                readOnly: true,
                subPath: 'mnemonic.txt',
              },
            },
          },
          maizeEnabled: true,
          memLimit: '555',
          nchainEnabled: false,
          nodeIP: '192.168.1.100',
          shibgreenEnabled: false,
          staicoinEnabled: false,
          storEnabled: false,
          timezone: 'Europe/Paris',
        },
      }],
    );
  });
});
