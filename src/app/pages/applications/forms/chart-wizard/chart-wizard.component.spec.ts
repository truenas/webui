import { EventEmitter } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { createComponentFactory, mockProvider, Spectator } from '@ngneat/spectator/jest';
import { of } from 'rxjs';
import { mockCall, mockWebsocket } from 'app/core/testing/utils/mock-websocket.utils';
import { EntityJobComponent } from 'app/modules/entity/entity-job/entity-job.component';
import { IxFormsModule } from 'app/modules/ix-forms/ix-forms.module';
import { ChartWizardComponent } from 'app/pages/applications/forms/chart-wizard/chart-wizard.component';
import { IxSlideInService } from 'app/services/ix-slide-in.service';

describe('ChartWizardComponent', () => {
  let spectator: Spectator<ChartWizardComponent>;

  const mockDialogRef = {
    componentInstance: {
      setDescription: jest.fn(),
      setCall: jest.fn(),
      submit: jest.fn(),
      success: of(null),
      failure: new EventEmitter(),
    },
    close: jest.fn(),
  } as unknown as MatDialogRef<EntityJobComponent>;

  const existingChart = {
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

  const createComponent = createComponentFactory({
    component: ChartWizardComponent,
    imports: [
      IxFormsModule,
      ReactiveFormsModule,
    ],
    providers: [
      mockProvider(IxSlideInService),
      mockWebsocket([
        mockCall('chart.release.create'),
      ]),
      mockProvider(MatDialog, {
        open: jest.fn(() => mockDialogRef),
      }),
    ],
  });

  beforeEach(() => {
    spectator = createComponent();
  });

  it('shows values for an existing ChartWizard when form is opened', async () => {
    spectator.component.setCatalogApp(existingChart);

    const values = await spectator.component.form.value;

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

  it('edits existing ChartWizard when form is submitted', () => {
    spectator.component.setCatalogApp(existingChart);

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
});
