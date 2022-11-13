# coding=utf-8
"""SCALE UI feature tests."""
import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
    ssh_cmd
)




def test_verify_core_file_alert_works(driver, nas_ip, root_password):
    """test_verify_core_file_alert_works"""
    if not is_element_present(driver, '//span[contains(text(),"System Information")]'):
        assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 7, '//h1[text()="Dashboard"]')



    # on the dashboard, if there is dismiss all notification
    assert wait_on_element(driver, 7, '//h1[text()="Dashboard"]')
    #assert wait_on_element(driver, 7, '//span[contains(text(),"System Information")]')
    assert wait_on_element(driver, 15, '//mat-icon[contains(text(),"notifications")]')
    if wait_on_element(driver, 5, '//span[contains(.,"notifications")]//span[not(contains(text(),"0"))]'):
        assert wait_on_element(driver, 7, '//mat-icon[contains(.,"notifications")]', 'clickable')
        driver.find_element_by_xpath('//mat-icon[contains(.,"notifications")]').click()
        assert wait_on_element(driver, 7, '//h3[text()="Alerts"]')
        assert wait_on_element(driver, 7, '//button[contains(text(),"Dismiss All Alerts")]', 'clickable')
        driver.find_element_by_xpath('//button[contains(text(),"Dismiss All Alerts")]').click()
        assert wait_on_element(driver, 7, '//mat-icon[contains(.,"clear")]', 'clickable')
        driver.find_element_by_xpath('//mat-icon[contains(.,"clear")]').click()


    # kill a python process with ssh to trigger core files alert
    cmd = 'python3 -c "import os; os.abort()"'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    # Command will failed since kills a process
    assert results['result'] is False, results['output']


    # wait for the alert and verify the core files warning alert
    assert wait_on_element(driver, 10, '//mat-icon[contains(text(),"notifications")]')
    assert wait_on_element(driver, 180, '//span[contains(.,"notifications")]//span[contains(text(),"1")]')
    assert wait_on_element(driver, 10, '//mat-icon[contains(.,"notifications")]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[contains(.,"notifications")]').click()
    assert wait_on_element(driver, 20, '//h3[text()="Alerts"]')
    assert wait_on_element(driver, 20, '//h3[contains(.,"Warning")]')
    assert wait_on_element(driver, 20, '//h4[contains(.,"Core files for the following executables were found: /usr/bin/python")]')
    assert wait_on_element(driver, 20, '//ix-alert//mat-icon[contains(@class,"mat-warn")]')


    # click on the core files warning Dismiss and verify it is dismissed
    assert wait_on_element(driver, 7, '//div//a[contains(.,"Dismiss")]', 'clickable')
    driver.find_element_by_xpath('//div//a[contains(.,"Dismiss")]').click()
    assert wait_on_element(driver, 7, '//ix-alert//mat-icon[contains(.,"check_circle")]')


    # click on the core files warning Re-Open and verify the alert is back
    assert wait_on_element(driver, 7, '//h4[contains(.,"Core files")]//ancestor::ix-alert//div//a[contains(.,"Re-Open")]', 'clickable')
    driver.find_element_by_xpath('//h4[contains(.,"Core files")]//ancestor::ix-alert//div//a[contains(.,"Re-Open")]').click()
    assert wait_on_element(driver, 20, '//h3[contains(.,"Warning")]')
    assert wait_on_element(driver, 7, '//button[contains(.,"clear")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"clear")]').click()


    # after remove the core files in "/var/db/system/cores"
    cmd = 'rm -f /var/db/system/cores/*'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert results['result'] is True, results['output']


    # verify that the core file alert disappear
    assert wait_on_element_disappear(driver, 180, '//span[contains(.,"notifications")]//span[contains(text(),"1")]')
    driver.find_element_by_xpath('//mat-icon[contains(.,"notifications")]').click()
    assert wait_on_element(driver, 7, '//h3[text()="Alerts"]')
    assert not is_element_present(driver, '//h4[contains(.,"Core files")]')
    assert wait_on_element(driver, 7, '//button[contains(.,"clear")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"clear")]').click()
    time.sleep(0.5)

