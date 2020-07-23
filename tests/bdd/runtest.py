#!/usr/bin/env python3

import sys
import os
import getopt
from subprocess import call
from platform import system
major_v = sys.version_info.major
minor_v = sys.version_info.minor
version = f"{major_v}" if system() == "Linux" else f"{major_v}.{minor_v}"
cwd = str(os.getcwd())
screenshot_path = f"{cwd}/screenshot"
argument = sys.argv
UsageMSG = f"""Usage for {argument[0]}:
Options:

--help                           - Show all options.
--ip <0.0.0.0>                   - IP of the targeted TrueNAS server/
--root-password <password>       - need root password for login.
--convert-feature                - This convert Jira feature files
                                   for pytest-bdd.
--test-suite                     - To specify the test suite to run ha-bhyve02
                                   is use by default.
                                   test-suite options: ha-bhyve02, ha-tn09
"""


# list of argument that should be use.
option_list = [
    "help",
    "ip=",
    'root-password=',
    'convert-feature',
    'test-suite='
]

test_suite_list = [
    'ha-bhyve02',
    'ha-tn09'
]


def convert_jira_feature_file(directory):
    # convert Jira feature file for pytest-bdd cucumber results.
    feature_list = os.listdir(f'{directory}/features')
    if '.keepme' in feature_list:
        feature_list.remove('.keepme')

    for feature_file in feature_list:
        feature = open(f'{directory}/features/{feature_file}', 'r')
        old_feature = feature.readlines()
        new_feature = open(f'{directory}/features/{feature_file}', 'w')
        for line in old_feature:
            if 'Feature:' in line:
                feature_list = line.split(':')
                if len(feature_list) == 3:
                    new_line = f'{feature_list[0]}:{feature_list[1]}\n'
                    new_feature.writelines(new_line)
                else:
                    new_feature.writelines(line)
            elif 'Scenario' in line:
                scenario_list = line.split(':')
                if len(scenario_list) == 3:
                    new_line = f'{scenario_list[0]}:{scenario_list[2]}'
                    new_feature.writelines(new_line)
                else:
                    new_feature.writelines(line)
            else:
                new_feature.writelines(line)
        new_feature.close()


# look if all the argument are there.
try:
    myopts, args = getopt.getopt(argument[1:], None, option_list)
except getopt.GetoptError as e:
    print(str(e))
    print(UsageMSG)
    sys.exit(1)

global ip, password
test_suite = 'ha-bhyve02'
run_convert = False

for output, arg in myopts:
    if output == '--ip':
        ip = arg
    elif output == '--root-password':
        password = arg
    elif output == '--test-suite':
        test_suite = arg
        if test_suite not in test_suite_list:
            print(f'--test-suite {test_suite} it not valide')
            print('Only the folowing are allowed:')
            for suite in test_suite_list:
                print(f'    --test-suite {suite}')
            exit(1)
    elif output == "--convert-feature":
        run_convert = True
    elif output == "--help":
        print(UsageMSG)
        exit(0)


def run_testing():
    if 'ip' in globals() and 'password' in globals():
        cfg = "[NAS_CONFIG]\n"
        cfg += f"ip = {ip}\n"
        cfg += f"password = {password}\n"
        cfg_file = open("config.cfg", 'w')
        cfg_file.write(cfg)
        cfg_file.close()

    convert_jira_feature_file(test_suite)
    pytestcmd = [
        f"pytest-{version}",
        "-vs",
        test_suite,
        "--junitxml=results/junit/webui_test.xml",
        "--cucumber-json=results/cucumber/webui_test.json"
    ]

    call(pytestcmd)


if run_convert is True:
    convert_jira_feature_file(test_suite)
else:
    run_testing()
