import { GatewayPlatformStatus, GatewayStatusResponse } from 'app/pages/harbor-assistant/interfaces/harbor-assistant-status.interface';

const HARBOR_GATE_PUBLIC_PREFIX = '/api/harbor-gate';

export function harborGateConnectorSetupUrl(
  connectorId: string,
  platform: GatewayPlatformStatus | null | undefined,
  gateway: GatewayStatusResponse | null | undefined,
  baseOrigin = globalThis.location?.origin ?? 'http://localhost',
): string | null {
  const candidates = connectorId === 'weixin'
    ? [
      platformSpecificWeixinUrl(platform?.qr_page_url),
      platformSpecificWeixinUrl(gateway?.weixin?.qr_page_url),
      platformSpecificWeixinUrl(platform?.setup_url),
      platformSpecificWeixinUrl(gateway?.weixin?.setup_url),
    ]
    : connectorId === 'feishu'
      ? [
        platform?.setup_url,
        gateway?.feishu?.setup_url,
        gateway?.setup_url,
        gateway?.static_setup_url,
      ]
      : [
        platform?.setup_url,
        gateway?.setup_url,
        gateway?.static_setup_url,
      ];

  return sameOriginHarborGateUrl(firstUrl(candidates), baseOrigin);
}

export function harborGateConnectorManageUrl(
  connectorId: string,
  platform: GatewayPlatformStatus | null | undefined,
  gateway: GatewayStatusResponse | null | undefined,
  baseOrigin = globalThis.location?.origin ?? 'http://localhost',
): string | null {
  const candidates = connectorId === 'weixin'
    ? [
      platform?.manage_url,
      gateway?.weixin?.manage_url,
    ]
    : connectorId === 'feishu'
      ? [
        platform?.manage_url,
        gateway?.feishu?.manage_url,
        gateway?.manage_url,
      ]
      : [
        platform?.manage_url,
        gateway?.manage_url,
      ];

  return sameOriginHarborGateUrl(firstUrl(candidates), baseOrigin);
}

export function sameOriginHarborGateUrl(rawUrl: string | null | undefined, baseOrigin = globalThis.location?.origin ?? 'http://localhost'): string | null {
  const trimmed = rawUrl?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed, baseOrigin);
    const sameOriginPath = harborGatePublicPath(url.pathname);
    if (sameOriginPath) {
      return `${sameOriginPath}${url.search}${url.hash}`;
    }
  } catch {
    return null;
  }

  return null;
}

function harborGatePublicPath(pathname: string): string | null {
  if (pathname === HARBOR_GATE_PUBLIC_PREFIX || pathname.startsWith(`${HARBOR_GATE_PUBLIC_PREFIX}/`)) {
    return pathname;
  }
  if (
    pathname === '/setup'
    || pathname.startsWith('/setup/')
    || pathname === '/admin/im'
    || pathname.startsWith('/admin/im/')
    || pathname.startsWith('/api/setup/')
  ) {
    return `${HARBOR_GATE_PUBLIC_PREFIX}${pathname}`;
  }
  return null;
}

function firstUrl(candidates: (string | null | undefined)[]): string | null {
  return candidates.find((candidate) => Boolean(candidate?.trim())) ?? null;
}

function platformSpecificWeixinUrl(rawUrl: string | null | undefined): string | null {
  const trimmed = rawUrl?.trim();
  if (!trimmed) {
    return null;
  }

  try {
    const url = new URL(trimmed, globalThis.location?.origin ?? 'http://localhost');
    const haystack = `${url.pathname}${url.search}`.toLowerCase();
    if (haystack.includes('weixin') || haystack.includes('wechat')) {
      return trimmed;
    }
  } catch {
    const lower = trimmed.toLowerCase();
    if (lower.includes('weixin') || lower.includes('wechat')) {
      return trimmed;
    }
  }

  return null;
}
