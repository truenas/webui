/**
 * Reads the archives middleware hands the browser, so a spec can check what a download holds.
 *
 * Middleware writes them with Python's `tarfile`: a 512-byte header per member, often preceded by a
 * PAX `x` header, then the member's data padded to the block, and two empty blocks at the end.
 */

const tarBlockBytes = 512;

export interface TarMember {
  name: string;
  data: Buffer;
}

/** A NUL-terminated field of a tar header. */
function tarString(field: Buffer): string {
  const end = field.indexOf(0);
  return field.subarray(0, end === -1 ? field.length : end).toString('utf8');
}

/** The members of a ustar archive, in order. */
export function tarMembers(archive: Buffer): TarMember[] {
  const members: TarMember[] = [];
  let offset = 0;
  while (offset + tarBlockBytes <= archive.length) {
    const header = archive.subarray(offset, offset + tarBlockBytes);
    if (header.every((byte) => byte === 0)) {
      break;
    }

    const size = parseInt(tarString(header.subarray(124, 136)).trim(), 8);
    // `x` and `g` are PAX extended headers, which describe a member rather than being one.
    const type = tarString(header.subarray(156, 157));
    if (type !== 'x' && type !== 'g') {
      const start = offset + tarBlockBytes;
      members.push({
        name: tarString(header.subarray(0, 100)),
        data: archive.subarray(start, start + size),
      });
    }
    offset += tarBlockBytes + Math.ceil(size / tarBlockBytes) * tarBlockBytes;
  }
  return members;
}
