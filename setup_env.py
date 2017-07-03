#!/usr/bin/env python

import shutil
import sys
import getopt

def main(argv):
    proxy_config_json = './proxy.config.json'
    proxy_config_json_skel = './proxy.config.json.skel'
    environment_ts = './src/environments/environment.ts'
    environment_ts_skel = './src/environments/environment.ts.skel'
    ip_addr = None
    helpmesg = "setup_env.py -i <ip_address>"

    try:
        opts, args = getopt.getopt(argv, "hi:", ["ip="])
    except getopt.GetoptError:
        print(helpmesg)
        sys.exit(2)
    if not opts:
        print(helpmesg)
        sys.exit(2)
    for opt, arg in opts:
        if opt == '-h':
            print(helpmesg)
            sys.exit(2)
        if opt in ('-i', '--ip'):
            ip_addr = arg

        shutil.copy(proxy_config_json_skel, proxy_config_json)
        shutil.copy(environment_ts_skel, environment_ts)


        with open(proxy_config_json) as proxy_file:
            new_proxy_conf = proxy_file.read().replace('$SERVER$', ip_addr)

        with open(proxy_config_json, "w") as proxy_file:
            proxy_file.write(new_proxy_conf)

        with open(environment_ts) as env_file:
            new_environment = env_file.read().replace('$SERVER$', ip_addr)

        with open(environment_ts, "w") as env_file:
            env_file.write(new_environment)

if __name__ == "__main__":
    main(sys.argv[1:])
