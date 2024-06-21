#!/usr/bin/env python3

import sys
import os
import getopt
import json
from configparser import ConfigParser
from subprocess import run
cwd = os.getcwd()
screenshot_path = f"{cwd}/screenshot"
argument = sys.argv
UsageMSG = f"""Usage for {argument[0]}:
Options:

--help                           - Show all options.
--ip <0.0.0.0>                   - IP of the targeted TrueNAS server/
--root-password <password>       - need root password for login.
--convert-feature                - This convert Jira feature files
                                   for pytest-bdd.
--test-suite                     - To specify the test suite to run scale-ha
                                   is use by default. test-suite options:
                                   scale-ha, scale, scale-validation
--marker      <marker>           - Pytest markers to use like debug_test
"""


# list of argument that should be used.
option_list = [
    "help",
    "ip=",
    'root-password=',
    'convert-feature',
    'test-suite=',
    'iso-version=',
    'marker='
]

test_suite_list = [
    'scale-ha',
    'scale'
]

markers_list = [
    'debug_test'
]


def convert_jira_feature_file(directory):
    # convert Jira feature file for pytest-bdd cucumber results.
    feature_list = os.listdir(f'{directory}/features')
    if '.keepme' in feature_list:
        feature_list.remove('.keepme')

    for feature_file in feature_list:
        feature = open(f'{directory}/features/{feature_file}', 'r')
        old_feature = feature.readlines()
        with open(f'{directory}/features/{feature_file}', 'w') as new_feature:
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


# look if all the argument are there.
try:
    my_opts, args = getopt.getopt(argument[1:], None, option_list)
except getopt.GetoptError as e:
    print(str(e))
    print(UsageMSG)
    sys.exit(1)

global ip, password
test_suite = 'scale'
run_convert = False
marker = ''

for output, arg in my_opts:
    if output == '--ip':
        ip = arg
    elif output == '--root-password':
        password = arg
    elif output == '--test-suite':
        test_suite = arg
        if test_suite not in test_suite_list:
            print(f'--test-suite {test_suite} it not valid')
            print('Only the following are allowed:')
            for suite in test_suite_list:
                print(f'    --test-suite {suite}')
            exit(1)
    elif output == '--iso-version':
        version = arg
    elif output == "--convert-feature":
        run_convert = True
    elif output == "--help":
        print(UsageMSG)
        exit(0)
    elif output == '--marker':
        if arg in markers_list:
            marker = arg
        else:
            print(f'"{arg}" is not a supported marker')
            print('Here is the list supported markers:\n',
                  markers_list)
            exit(1)


def run_testing():
    if os.path.exists(f'{cwd}/config.cfg'):
        configs = ConfigParser()
        configs.read('config.cfg')
        os.environ["nas_ip"] = configs['NAS_CONFIG']['ip']
        if test_suite == 'scale-ha':
            os.environ["nas_ip2"] = configs['NAS_CONFIG']['ip2']
            os.environ["nas_vip"] = configs['NAS_CONFIG']['vip']
        os.environ["nas_password"] = configs['NAS_CONFIG']['password']
    else:
        print(f'{cwd}/config.cfg not found')
        exit(1)

    os.environ['test_suite'] = test_suite

    convert_jira_feature_file(test_suite)
    pytest_cmd = [
        sys.executable,
        '-m',
        'pytest',
        '-vs',
        test_suite,
        "--junitxml=results/junit/webui_test.xml",
        "--cucumber-json=results/cucumber/webui_test.json"
    ]
    if marker:
        pytest_cmd.append("-k")
        pytest_cmd.append(marker)
    run(pytest_cmd)
    with open('results/cucumber/webui_test.json') as openfile:
        data = json.load(openfile)
        for num in range(len(data)):
            if len(data[num]['elements'][0]['steps']) == 1:
                data[num]['elements'][0]['steps'][0]['result']['status'] = 'skipped'
        with open('results/cucumber/webui_test.json', 'w') as outfile:
            json.dump(data, outfile)


if run_convert is True:
    convert_jira_feature_file(test_suite)
else:
    run_testing()
