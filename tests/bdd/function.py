#!/usr/bin/env python3

import json
import os
import pexpect
import re
import requests
import sys
import time
from collections.abc import Iterable
from selenium.common.exceptions import (
    NoSuchElementException,
    TimeoutException
)
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as ec
from subprocess import run, PIPE, TimeoutExpired

header = {'Content-Type': 'application/json', 'Vary': 'accept'}


def is_element_present(driver, xpath):
    try:
        driver.find_element_by_xpath(xpath)
    except NoSuchElementException:
        return False
    return True


def wait_on_element(driver, wait, xpath, condition=None):
    if condition == 'clickable':
        try:
            WebDriverWait(driver, wait).until(ec.element_to_be_clickable((By.XPATH, xpath)))
            return True
        except TimeoutException:
            return False
    elif condition == 'inputable':
        time.sleep(1)
        try:
            WebDriverWait(driver, wait).until(ec.element_to_be_clickable((By.XPATH, xpath)))
            return True
        except TimeoutException:
            return False
    elif condition == 'presence':
        try:
            WebDriverWait(driver, wait).until(ec.presence_of_element_located((By.XPATH, xpath)))
            return True
        except TimeoutException:
            return False
    else:
        try:
            WebDriverWait(driver, wait).until(ec.visibility_of_element_located((By.XPATH, xpath)))
            return True
        except TimeoutException:
            return False


def wait_on_element_disappear(driver, wait, xpath):
    timeout = time.time() + wait
    while time.time() <= timeout:
        if not is_element_present(driver, xpath):
            return True
        # this just to slow down the loop
        time.sleep(0.1)
    else:
        return False


def refresh_if_element_missing(driver, wait, xpath):
    timeout = time.time() + wait
    while time.time() <= timeout:
        time.sleep(5)
        # if wait_on_element(driver, 3, xpaths.login.user_input):
        #     """login appear enter "root" and "password"."""
        #     assert wait_on_element(driver, 7, xpaths.login.user_input)
        #     driver.find_element_by_xpath(xpaths.login.user_input).clear()
        #     driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        #     driver.find_element_by_xpath(xpaths.login.password_input).clear()
        #     driver.find_element_by_xpath(xpaths.login.password_input).send_keys('testing')
        #     assert wait_on_element(driver, 7, xpaths.login.signin_button, 'clickable')
        #     driver.find_element_by_xpath(xpaths.login.signin_button).click()
        if wait_on_element(driver, 3, xpath):
            return True
        driver.refresh()
    else:
        return False


def attribute_value_exist(driver, xpath, attribute, value):
    element = driver.find_element_by_xpath(xpath)
    class_attribute = element.get_attribute(attribute)
    if value in class_attribute:
        return True
    else:
        return False


def wait_for_attribute_value(driver, wait, xpath, attribute, value):
    timeout = time.time() + wait
    while time.time() <= timeout:
        if attribute_value_exist(driver, xpath, attribute, value):
            return True
        # this just to slow down the loop
        time.sleep(0.1)
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
    try:
        process = run(cmd, stdout=PIPE, stderr=PIPE, universal_newlines=True,
                      timeout=5)
        output = process.stdout
        stderr = process.stderr
        if process.returncode != 0:
            return {'result': False, 'output': output, 'stderr': stderr}
        else:
            return {'result': True, 'output': output, 'stderr': stderr}
    except TimeoutExpired:
        return {'result': False, 'output': 'Timeout', 'stderr': 'Timeout'}


def start_ssh_agent():
    process = run(['ssh-agent', '-s'], stdout=PIPE, universal_newlines=True)
    torecompil = r'SSH_AUTH_SOCK=(?P<socket>[^;]+).*SSH_AGENT_PID=(?P<pid>\d+)'
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
    process = run(f'ssh-keygen -t rsa -f {keyPath} -q -N ""', shell=True)
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
    process = run(command, shell=True, stdout=PIPE, stderr=PIPE,
                  universal_newlines=True)
    stdout = process.stdout
    stderr = process.stderr
    if process.returncode != 0:
        return {'result': False, 'output': stdout, 'stderr': stderr}
    else:
        return {'result': True, 'output': stdout, 'stderr': stderr}


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


def ssh_sudo(cmd, host, user, password):
    options = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null " \
        "-o VerifyHostKeyDNS=no"
    command = f'ssh {options} {user}@{host} "sudo -S {cmd}"'
    child = pexpect.spawn(command, encoding='utf-8')
    child.logfile = sys.stdout
    child.expect(f'ssword for {user}:')
    child.sendline(password)
    child.expect(pexpect.EOF)
    return child.before


def ssh_sudo_exptext(cmd, host, user, password, expect_text):
    options = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null " \
        "-o VerifyHostKeyDNS=no"
    command = f'ssh {options} {user}@{host} "sudo -S {cmd}"'
    child = pexpect.spawn(command, encoding='utf-8')
    child.logfile = sys.stdout
    child.expect(f'ssword for {user}:')
    child.sendline(password)
    child.expect(expect_text)
    return child.before


def interactive_ssh(cmd, host, user, password):
    options = "-o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null " \
        "-o VerifyHostKeyDNS=no"
    command = f'ssh {options} {user}@{host} "{cmd}"'
    child = pexpect.spawn(command, encoding='utf-8')
    # child.logfile = sys.stdout
    child.expect('ssword:')
    child.sendline(password)
    return child


def make_bytes(item):
    '''Cast the item to a bytes data type.'''

    if isinstance(item, bytes) or isinstance(item, bytearray):
        return item
    if isinstance(item, str):
        return bytes(item, 'UTF-8')
    if isinstance(item, int):
        return bytes([item])
    if isinstance(item, Iterable):
        return b''.join([make_bytes(i) for i in item])

    # We should get here, but if we do we need a better solution
    raise TypeError(f'Cannot easily cast type {type(item)} to bytes')


def word_xor(data, key):
    '''Apply xor operation to data by breaking it up into len(key)-sized blocks'''
    # Data should be a bytes or byte array, key should be 64 bits.
    # Iterate through the bytes array and

    data = make_bytes(data)
    key = make_bytes(key)
    length = len(key)
    result = bytearray()
    cycles = len(data)
    for i in range(cycles):
        result += (data[i] ^ key[i % length]).to_bytes(1, 'little')

    return result


def wait_On_Job(hostname, auth, job_id, max_timeout):
    global job_results
    timeout = 0
    while True:
        job_results = get(hostname, f'/core/get_jobs/?id={job_id}', auth)
        job_state = job_results.json()[0]['state']
        if job_state in ('RUNNING', 'WAITING'):
            time.sleep(5)
        elif job_state in ('SUCCESS', 'FAILED'):
            return {'state': job_state, 'results': job_results.json()[0]}
        if timeout >= max_timeout:
            return {'state': 'TIMEOUT', 'results': job_results.json()[0]}
        timeout += 5


def get_Singl_Unused_Disk(hostname, auth):
    return [post(hostname, '/disk/get_unused/', auth).json()[0]['name']]


def post_Pool(hostname, auth, pool_name, payload):
    results = post(hostname, '/pool/', auth, payload)
    assert results.status_code == 200, results.text
    job_id = results.json()
    job_status = wait_On_Job(hostname, auth, job_id, 180)
    assert job_status['state'] == 'SUCCESS', str(job_status['results'])


def create_Pool(hostname, auth, pool_name):
    payload = {
        'name': pool_name,
        'encryption': False,
        'topology': {
            'data': [
                {
                    'type': 'STRIPE',
                    'disks': get_Singl_Unused_Disk(hostname, auth)
                }
            ],
        }
    }
    post_Pool(hostname, auth, pool_name, payload)


def create_Encrypted_Pool(hostname, auth, pool_name):
    payload = {
        'name': pool_name,
        'encryption': True,
        'encryption_options': {
            'generate_key': True
        },
        'topology': {
            'data': [
                {
                    'type': 'STRIPE',
                    'disks': get_Singl_Unused_Disk(hostname, auth)
                }
            ],
        }
    }
    post_Pool(hostname, auth, pool_name, payload)


def service_Start(hostname, auth, service_name):
    """
    Start service.
    :param hostname: Hostname of IP of the NAS.
    :param auth: (username, password) tuple.
    :param service_name: Service name to start.

    Example:
        - service_Start('00.00.00.00', ('admin', 'admin'), 'smb')
    """
    results = post(hostname, '/service/start/', auth, {"service": service_name})
    assert results.status_code == 200, results.text


def delete_dataset(hostname: str, auth: tuple, dataset_name: str):
    """
    This function delete the given dataset.
    :param hostname: Hostname of IP of the NAS.
    :param auth: (username, password) tuple.
    :param dataset_name: Dataset name to delete.

    Example:
        - delete_dataset('00.00.00.00', ('admin', 'admin'), 'data')
    """
    results = delete(hostname, f'/pool/dataset/id/{dataset_name.replace("/", "%2F")}', auth)
    assert results.status_code == 200, results.text


def save_screenshot(driver, name):
    driver.save_screenshot(name)


def create_group(ip: str, auth: tuple, group_name: str) -> None:
    """
    This method creates the given group by API call

    :param ip: IP of the TrueNAS server
    :param auth: (username, password) tuple
    :param group_name: Name of the group to create
    :return: Response object

    Example:
        - create_group('00.00.00.00', ('admin', 'admin'), 'group1')
    """
    payload = {
        "name": group_name
    }
    response = post(ip, '/group', auth, payload)
    assert response.status_code == 200, response.text
