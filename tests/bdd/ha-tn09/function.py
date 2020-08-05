#!/usr/bin/env python3

import time
from selenium.common.exceptions import NoSuchElementException
from subprocess import run, PIPE


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


def arttribute_value_exist(driver, xpath, attribute, value):
    element = driver.find_element_by_xpath(xpath)
    class_attribute = element.get_attribute(attribute)
    if value in class_attribute:
        return True
    else:
        return False


def wait_for_attribute_value(driver, wait, loop, xpath, attribute, value):
    for _ in range(loop):
        time.sleep(wait)
        if arttribute_value_exist(driver, xpath, attribute, value):
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
