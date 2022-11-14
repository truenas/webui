#!/usr/bin/env python3

import json
import os
import pexpect
import re
import requests
import time
from selenium.common.exceptions import (
    NoSuchElementException,
    TimeoutException
)
from selenium.webdriver.common.by import By
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as ec

from subprocess import run, PIPE

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
        if wait_on_element(driver, 3, '//input[@data-placeholder="Username"]'):
            """login appear enter "root" and "password"."""
            assert wait_on_element(driver, 7, '//input[@data-placeholder="Username"]')
            driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
            driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
            driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
            driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys('testing')
            assert wait_on_element(driver, 7, '//button[@name="signin_button"]', 'clickable')
            driver.find_element_by_xpath('//button[@name="signin_button"]').click()
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
    process = run(cmd, stdout=PIPE, stderr=PIPE, universal_newlines=True)
    output = process.stdout
    stderr = process.stderr
    if process.returncode != 0:
        return {'result': False, 'output': output, 'stderr': stderr}
    else:
        return {'result': True, 'output': output, 'stderr': stderr}


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
    process = run(command, shell=True, stdout=PIPE, stderr=PIPE,
                  universal_newlines=True)
    output = process.stdout
    stderr = process.stderr
    if process.returncode != 0:
        return {'result': False, 'output': output, 'stderr': stderr}
    else:
        return {'result': True, 'output': output, 'stderr': stderr}


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
    # child.logfile = sys.stdout
    child.expect('ssword:')
    child.sendline(password)
    child.expect(f'ssword for {user}:')
    child.sendline(password)
    child.expect(pexpect.EOF)
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
