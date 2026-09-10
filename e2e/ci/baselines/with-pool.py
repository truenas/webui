#!/usr/bin/env python3
"""Configure a running template guest into the `with-pool` baseline.

One striped pool named `tank` on the first unused disk, and nothing else. It
runs between `tn_guest.py create --template --leave-running` and
`tn_guest.py freeze`, over the guest's own API, so every clone of the
template boots with a pool present and no journey has to build one. Journeys
about building a pool ask for the `fresh-install` baseline instead.

The pool is `tank` rather than the suite's own `e2e_shared_tank` on purpose:
the suite's pool fixture prefers any pool that is not its own, and only
exports the one it built. A baked pool is the appliance's, and stays.

Arguments: the guest API URI and the admin user. The admin password comes
from TN_ADMIN_PASSWORD in the environment, never the command line.
"""
import argparse
import os
import sys

from truenas_api_client import Client

POOL_NAME = "tank"


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__.split("\n", 1)[0])
    parser.add_argument("--uri", required=True, help="ws://host:port/api/current")
    parser.add_argument("--user", required=True, help="admin user on the guest")
    args = parser.parse_args()

    password = os.environ.get("TN_ADMIN_PASSWORD")
    if not password:
        print("with-pool: TN_ADMIN_PASSWORD is not set", file=sys.stderr)
        return 2

    client = Client(uri=args.uri, verify_ssl=False)
    try:
        response = client.call(
            "auth.login_ex",
            {"mechanism": "PASSWORD_PLAIN", "username": args.user, "password": password},
        )
        if response.get("response_type") != "SUCCESS":
            print(f"with-pool: login as {args.user} failed: {response}", file=sys.stderr)
            return 1

        if client.call("pool.query", [["name", "=", POOL_NAME]]):
            print(f"with-pool: pool {POOL_NAME!r} already exists", file=sys.stderr)
            return 1

        disks = client.call("disk.get_unused")
        if not disks:
            print("with-pool: the guest has no unused disk to build the pool from", file=sys.stderr)
            return 1
        disk = disks[0]["devname"]

        print(f"with-pool: creating pool {POOL_NAME!r} on {disk}", file=sys.stderr)
        client.call(
            "pool.create",
            {"name": POOL_NAME, "topology": {"data": [{"type": "STRIPE", "disks": [disk]}]}},
            job=True,
        )

        pools = client.call("pool.query", [["name", "=", POOL_NAME]])
        if not pools or pools[0].get("status") != "ONLINE":
            print(f"with-pool: pool {POOL_NAME!r} is not ONLINE after creation: {pools}", file=sys.stderr)
            return 1
        print(f"with-pool: pool {POOL_NAME!r} is ONLINE", file=sys.stderr)
        return 0
    finally:
        client.close()


if __name__ == "__main__":
    sys.exit(main())
