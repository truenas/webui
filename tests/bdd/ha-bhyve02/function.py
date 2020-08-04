#!/usr/bin/env python3

import time
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException
from subprocess import run, PIPE


def is_element_present(driver, bytype, what):
    if bytype == 'xpath':
        how = By.XPATH
    elif bytype == 'id':
        how = By.ID
    try:
        driver.find_element(by=how, value=what)
    except NoSuchElementException:
        return False
    return True


def wait_on_element(driver, wait, loop, bytype, what):
    for _ in range(loop):
        time.sleep(wait)
        if is_element_present(driver, bytype, what):
            return True
    else:
        return False


def wait_on_element_disappear(driver, wait, loop, bytype, what):
    for _ in range(loop):
        time.sleep(wait)
        if not is_element_present(driver, bytype, what):
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