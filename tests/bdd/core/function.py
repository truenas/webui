#!/usr/bin/env python3

import time
import os
import re
import requests
import json
from selenium.common.exceptions import NoSuchElementException
from subprocess import run, PIPE

header = {'Content-Type': 'application/json', 'Vary': 'accept'}


def is_element_present(driver, xpath):
    try:
        driver.find_element_by_xpath(xpath)
    except NoSuchElementException:
        return False
    return True


def wait_on_element(driver, wait, loop, xpath):
    for _ in range(loop):
        time.sleep(wait)
        if is_element_present(driver, xpath):
            return True
    else:
        return False


def wait_on_element_disappear(driver, wait, loop, xpath):
    for _ in range(loop):
        time.sleep(wait)
        if not is_element_present(driver, xpath):
            return True
    else:
        return False


def attribute_value_exist(driver, xpath, attribute, value):
    element = driver.find_element_by_xpath(xpath)
    class_attribute = element.get_attribute(attribute)
    if value in class_attribute:
        return True
    else:
        return False


def wait_for_attribute_value(driver, wait, loop, xpath, attribute, value):
    for _ in range(loop):
        time.sleep(wait)
        if attribute_value_exist(driver, xpath, attribute, value):
            return True
    else:
        return False


def ssh_cmd(command, username, password, host):
    cmd = [] if password is None else ["sshpass", "-p", password]
    cmd += [
        "ssh",
        "-o",
        "StrictHostKeyChecking=no",
        "-o",
        "UserKnownHostsFile=/dev/null",
        "-o",
        "VerifyHostKeyDNS=no",
        f"{username}@{host}",
        command
    ]
    process = run(cmd, stdout=PIPE, universal_newlines=True)
    output = process.stdout
    if process.returncode != 0:
        return {'result': False, 'output': output}
    else:
        return {'result': True, 'output': output}


def start_ssh_agent():
    process = run(['ssh-agent', '-s'], stdout=PIPE, universal_newlines=True)
    torecompil = 'SSH_AUTH_SOCK=(?P<socket>[^;]+).*SSH_AGENT_PID=(?P<pid>\d+)'
    OUTPUT_PATTERN = re.compile(torecompil, re.MULTILINE | re.DOTALL)
    match = OUTPUT_PATTERN.search(process.stdout)
    if match is None:
        return False
    else:
        agentData = match.groupdict()
        os.environ['SSH_AUTH_SOCK'] = agentData['socket']
        os.environ['SSH_AGENT_PID'] = agentData['pid']
        return True


def is_agent_setup():
    return os.environ.get('SSH_AUTH_SOCK') is not None


def setup_ssh_agent():
    if is_agent_setup():
        return True
    else:
        return start_ssh_agent()


def create_key(keyPath):
    process = run('ssh-keygen -t rsa -f %s -q -N ""' % keyPath, shell=True)
    if process.returncode != 0:
        return False
    else:
        return True


def if_key_listed():
    process = run('ssh-add -L', shell=True)
    if process.returncode != 0:
        return False
    else:
        return True


def add_ssh_key(keyPath):
    process = run(['ssh-add', keyPath])
    if process.returncode != 0:
        return False
    else:
        return True


def run_cmd(command):
    process = run(command, shell=True, stdout=PIPE, universal_newlines=True)
    output = process.stdout
    if process.returncode != 0:
        return {'result': False, 'output': output}
    else:
        return {'result': True, 'output': output}


def get(url, api_path, auth):
    get_it = requests.get(
        f'http://{url}/api/v2.0/{api_path}',
        headers=header,
        auth=auth
    )
    return get_it


def post(url, api_path, auth, payload=None):
    post_it = requests.post(
        f'http://{url}/api/v2.0/{api_path}',
        headers=header,
        auth=auth,
        data=json.dumps(payload) if payload else None
    )
    return post_it


def put(url, api_path, auth, payload=None):
    put_it = requests.put(
        f'http://{url}/api/v2.0/{api_path}',
        headers=header,
        auth=auth,
        data=json.dumps(payload) if payload else None
    )
    return put_it


def delete(url, api_path, auth, payload=None):
    delete_it = requests.delete(
        f'http://{url}/api/v2.0/{api_path}',
        headers=header,
        auth=auth,
        data=json.dumps(payload) if payload else None
    )
    return delete_it
