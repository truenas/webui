# coding=utf-8
"""SCALE UI feature tests."""

import os
import pytest
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    setup_ssh_agent,
    wait_on_element_disappear,
    create_key,
    add_ssh_key,
    ssh_cmd
)

localHome = os.path.expanduser('~')
dotsshPath = localHome + '/.ssh'
keyPath = localHome + '/.ssh/ui_test_id_rsa'

setup_ssh_agent()
if os.path.isdir(dotsshPath) is False:
    os.makedirs(dotsshPath)
if os.path.exists(keyPath) is False:
    create_key(keyPath)
add_ssh_key(keyPath)


@pytest.fixture(scope='module')
def ssh_key():
    ssh_key_file = open(f'{keyPath}.pub', 'r')
    return ssh_key_file.read().strip()


def test_user_ssh_key(driver, nas_ip):
    """user_ssh_key"""

    # the Users page should open, click the down carat sign right of the users
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()


    # the User Field should expand down, click the Edit button
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]').click()


    # the User Edit Page should open, input the SSH key and click save
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 5, '//ix-textarea[@formcontrolname = "sshpubkey"]//textarea', 'inputable')
    driver.find_element_by_xpath('//ix-textarea[@formcontrolname = "sshpubkey"]//textarea').clear()
    driver.find_element_by_xpath('//ix-textarea[@formcontrolname = "sshpubkey"]//textarea').send_keys(ssh_key)
    assert wait_on_element(driver, 2, '//button[span[contains(.,"Save")]]')
    driver.find_element_by_xpath('//button[span[contains(.,"Save")]]').click()
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')


    # reopen the user edit page and verify sshkey was saved.
    assert wait_on_element(driver, 7, '//div[contains(.,"Users")]')
    assert wait_on_element(driver, 10, '//tr[contains(.,"ericbsd")]//mat-icon', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"ericbsd")]//mat-icon').click()
    assert wait_on_element(driver, 10, '(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]', 'clickable')
    driver.find_element_by_xpath('(//tr[contains(.,"ericbsd")]/following-sibling::ix-user-details-row)[1]//button[contains(.,"Edit")]').click()
    assert wait_on_element(driver, 10, '//h3[contains(.,"Edit User")]')
    assert wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 5, '//ix-textarea[@formcontrolname = "sshpubkey"]//textarea', 'inputable')
    assert attribute_value_exist(driver, '//ix-textarea[@formcontrolname = "sshpubkey"]//textarea', 'value', ssh_key)
    time.sleep(0.5)
    assert wait_on_element(driver, 10, '//*[@id="ix-close-icon"]', 'clickable')
    driver.find_element_by_xpath('//*[@id="ix-close-icon"]').click()


    # Verify that you can ssh with the sshkey
    global results
    cmd = 'ls -al'
    results = ssh_cmd(cmd, 'ericbsd', None, nas_ip)
    assert results['result'], results['output']
    assert 'ssh' in results['output'], results['output']