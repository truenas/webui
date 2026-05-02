import { harborGateConnectorManageUrl, harborGateConnectorSetupUrl, sameOriginHarborGateUrl } from './harborgate-urls';

describe('HarborDesk HarborGate URL helpers', () => {
  const origin = 'http://192.168.3.182';

  it('does not reuse the Feishu setup QR for Weixin', () => {
    const gateway = {
      setup_url: 'http://192.168.3.182:8787/setup?session=feishu-session',
      static_setup_url: 'http://192.168.3.182:8787/setup',
      qr_page_url: 'http://192.168.3.182:8787/setup/qr',
      weixin: {
        platform: 'weixin',
        setup_url: 'http://192.168.3.182:8787/setup',
      },
      feishu: {
        platform: 'feishu',
        setup_url: 'http://192.168.3.182:8787/setup?session=feishu-session',
      },
    };

    expect(harborGateConnectorSetupUrl('weixin', gateway.weixin, gateway, origin)).toBeNull();
    expect(harborGateConnectorSetupUrl('feishu', gateway.feishu, gateway, origin)).toBe('/setup?session=feishu-session');
  });

  it('uses an explicit platform-specific Weixin setup URL when HarborGate provides one', () => {
    const gateway = {
      weixin: {
        platform: 'weixin',
        qr_page_url: 'http://192.168.3.182:8787/setup/weixin/qr',
      },
      setup_url: 'http://192.168.3.182:8787/setup?session=feishu-session',
    };

    expect(harborGateConnectorSetupUrl('weixin', gateway.weixin, gateway, origin)).toBe('/setup/weixin/qr');
  });

  it('normalizes HarborGate setup and manage URLs to same-origin paths', () => {
    const gateway = {
      manage_url: 'http://192.168.3.182:8787/admin/im',
      setup_url: 'http://192.168.3.182:8787/setup?session=feishu-session',
    };

    expect(harborGateConnectorSetupUrl('feishu', null, gateway, origin)).toBe('/setup?session=feishu-session');
    expect(harborGateConnectorManageUrl('feishu', null, gateway, origin)).toBe('/admin/im');
  });

  it('keeps Weixin and Feishu manage URLs platform-specific', () => {
    const gateway = {
      manage_url: 'http://192.168.3.182:8787/admin/im',
      weixin: {
        platform: 'weixin',
        manage_url: 'http://192.168.3.182:8787/admin/im/weixin',
        setup_url: 'http://192.168.3.182:8787/setup/weixin',
      },
      feishu: {
        platform: 'feishu',
        manage_url: 'http://192.168.3.182:8787/admin/im/feishu',
        setup_url: 'http://192.168.3.182:8787/setup/feishu?session=feishu-session',
      },
    };

    expect(harborGateConnectorSetupUrl('weixin', gateway.weixin, gateway, origin)).toBe('/setup/weixin');
    expect(harborGateConnectorSetupUrl('feishu', gateway.feishu, gateway, origin)).toBe('/setup/feishu?session=feishu-session');
    expect(harborGateConnectorManageUrl('weixin', gateway.weixin, gateway, origin)).toBe('/admin/im/weixin');
    expect(harborGateConnectorManageUrl('feishu', gateway.feishu, gateway, origin)).toBe('/admin/im/feishu');
  });

  it('keeps Weixin setup and admin links on same-origin paths', () => {
    expect(sameOriginHarborGateUrl('http://192.168.3.182:8787/setup/weixin?session=abc', origin)).toBe('/setup/weixin?session=abc');
    expect(sameOriginHarborGateUrl('http://192.168.3.182:8787/admin/im/weixin', origin)).toBe('/admin/im/weixin');
    expect(sameOriginHarborGateUrl('http://192.168.3.182:8787/api/setup/weixin/status', origin)).toBe('/api/setup/weixin/status');
  });

  it('drops unsupported HarborGate browser URLs instead of returning a cross-origin href', () => {
    expect(sameOriginHarborGateUrl('http://192.168.3.182:8787/internal/weixin', origin)).toBeNull();
    expect(sameOriginHarborGateUrl('javascript:alert(1)', origin)).toBeNull();
  });
});
