import { GatewayPlatformStatus, GatewayStatusResponse } from 'app/pages/harbor-assistant/interfaces/harbor-assistant-status.interface';

const harborGatePublicPrefix = '/api/harbor-gate';

export function harborGateConnectorSetupUrl(
  connectorId: string,
  platform: GatewayPlatformStatus | null | undefined,
  gateway: GatewayStatusResponse | null | undefined,
  baseOrigin = globalThis.location?.origin ?? 'http://localhost',
): string | null {
  let candidates: (string | null | undefined)[] = [
    platform?.setup_url,
    gateway?.setup_url,
    gateway?.static_setup_url,
  ];
  if (connectorId === 'weixin') {
    candidates = [
      platformSpecificWeixinUrl(platform?.qr_page_url),
      platformSpecificWeixinUrl(gateway?.weixin?.qr_page_url),
      platformSpecificWeixinUrl(platform?.setup_url),
      platformSpecificWeixinUrl(gateway?.weixin?.setup_url),
    ];
  } else if (connectorId === 'feishu') {
    candidates = [
      platform?.setup_url,
      gateway?.feishu?.setup_url,
      gateway?.setup_url,
      gateway?.static_setup_url,
    ];
  }

  return sameOriginHarborGateUrl(firstUrl(candidates), baseOrigin);
}

export function harborGateConnectorManageUrl(
  connectorId: string,
  platform: GatewayPlatformStatus | null | undefined,
  gateway: GatewayStatusResponse | null | undefined,
  baseOrigin = globalThis.location?.origin ?? 'http://localhost',
): string | null {
  let candidates: (string | null | undefined)[] = [
    platform?.manage_url,
    gateway?.manage_url,
  ];
  if (connectorId === 'weixin') {
    candidates = [
      platform?.manage_url,
      gateway?.weixin?.manage_url,
    ];
  } else if (connectorId === 'feishu') {
    candidates = [
      platform?.manage_url,
      gateway?.feishu?.manage_url,
      gateway?.manage_url,
    ];
  }

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
  if (pathname === harborGatePublicPrefix || pathname.startsWith(`${harborGatePublicPrefix}/`)) {
    return pathname;
  }
  if (
    pathname === '/setup'
    || pathname.startsWith('/setup/')
    || pathname === '/admin/im'
    || pathname.startsWith('/admin/im/')
    || pathname.startsWith('/api/setup/')
  ) {
    return `${harborGatePublicPrefix}${pathname}`;
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
