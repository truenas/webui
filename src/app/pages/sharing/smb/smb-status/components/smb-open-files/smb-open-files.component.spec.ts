import { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatAccordionHarness, MatExpansionPanelHarness } from '@angular/material/expansion/testing';
import { Spectator, createComponentFactory } from '@ngneat/spectator/jest';
import { SmbOpenFilesComponent } from './smb-open-files.component';

const locks = [
  {
    service_path: '/mnt/APPS/turtles',
    filename: '.',
    fileid: { devid: 70, inode: 3, extid: 0 },
    num_pending_deletes: 0,
    opens: {
      '2102401/69': {
        server_id: { pid: '2102401', task_id: '0', vnn: '4294967295', unique_id: '4458796888113407749' },
        uid: 3004,
        share_file_id: '69',
        sharemode: { hex: '0x00000007', READ: true, WRITE: true, DELETE: true, text: 'RWD' },
        access_mask: {
          hex: '0x00100081',
          READ_DATA: true,
          WRITE_DATA: false,
          APPEND_DATA: false,
          READ_EA: false,
          WRITE_EA: false,
          EXECUTE: false,
          READ_ATTRIBUTES: true,
          WRITE_ATTRIBUTES: false,
          DELETE_CHILD: false,
          DELETE: false,
          READ_CONTROL: false,
          WRITE_DAC: false,
          SYNCHRONIZE: true,
          ACCESS_SYSTEM_SECURITY: false,
          text: 'R',
        },
        caching: { READ: false, WRITE: false, HANDLE: false, hex: '0x00000000', text: '' },
        oplock: {},
        lease: {},
        opened_at: '2023-10-26T12:17:27.190608+02:00',
      },
      '2102401/70': {
        server_id: { pid: '2102401', task_id: '0', vnn: '4294967295', unique_id: '4458796888113407749' },
        uid: 3005,
        share_file_id: '70',
        sharemode: { hex: '0x00000007', READ: true, WRITE: true, DELETE: true, text: 'RWD' },
        access_mask: {
          hex: '0x00100081',
          READ_DATA: true,
          WRITE_DATA: false,
          APPEND_DATA: false,
          READ_EA: false,
          WRITE_EA: false,
          EXECUTE: false,
          READ_ATTRIBUTES: true,
          WRITE_ATTRIBUTES: false,
          DELETE_CHILD: false,
          DELETE: false,
          READ_CONTROL: false,
          WRITE_DAC: false,
          SYNCHRONIZE: true,
          ACCESS_SYSTEM_SECURITY: false,
          text: 'R',
        },
        caching: { READ: false, WRITE: false, HANDLE: false, hex: '0x00000000', text: '' },
        oplock: {},
        lease: {},
        opened_at: '2023-10-26T12:18:27.190608+02:00',
      },
    },
  },
];

describe('SmbOpenFilesComponent', () => {
  let spectator: Spectator<SmbOpenFilesComponent>;
  let loader: HarnessLoader;
  let accordion: MatAccordionHarness;
  let panels: MatExpansionPanelHarness[];

  const createComponent = createComponentFactory({
    component: SmbOpenFilesComponent,
    imports: [],
  });

  beforeEach(async () => {
    spectator = createComponent({
      props: {
        lock: locks[0],
      },
    });
    loader = TestbedHarnessEnvironment.loader(spectator.fixture);
    accordion = await loader.getHarness(MatAccordionHarness);
    panels = await accordion.getExpansionPanels();
  });

  it('should have multi accordion enabled', async () => {
    expect(await accordion.isMulti()).toBeTruthy();
  });

  it('should expand first panel and collapse second panel by default', async () => {
    expect(await panels[0].isExpanded()).toBeTruthy();
    expect(await panels[1].isExpanded()).toBeFalsy();
  });

  it('should display correct titles for panels', async () => {
    expect(await panels[0].getTitle()).toBe('2102401/69');
    expect(await panels[1].getTitle()).toBe('2102401/70');
  });

  it('should display correct content for panels', async () => {
    expect(await panels[0].getTextContent()).toContain('Share File ID: 69');
    expect(await panels[1].getTextContent()).toContain('Share File ID: 70');
  });
});
