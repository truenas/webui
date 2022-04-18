# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1223.feature', 'Verify core file alert works')
def test_verify_core_file_alert_works(driver):
    """Verify core file alert works."""


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    else:
        # the UI seams to get brooked at this point
        driver.refresh()
    if not wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 5, '//input[@data-placeholder="Username"]', 'inputable')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, if there is dismiss all notification')
def on_the_dashboard_if_there_is_dismiss_all_notification(driver):
    """on the dashboard, if there is dismiss all notification."""
    assert wait_on_element(driver, 7, '//h1[text()="Dashboard"]')
    assert wait_on_element(driver, 7, '//span[contains(text(),"System Information")]')
    assert wait_on_element(driver, 7, '//mat-icon[text()="notifications"]')
    if wait_on_element(driver, 5, '//span[contains(.,"notifications")]//span[not(contains(text(),"0"))]'):
        assert wait_on_element(driver, 7, '//button[contains(.,"notifications")]', 'clickable')
        driver.find_element_by_xpath('//button[contains(.,"notifications")]').click()
        assert wait_on_element(driver, 7, '//h3[text()="Alerts"]')
        assert wait_on_element(driver, 7, '//button[contains(text(),"Dismiss All Alerts")]', 'clickable')
        driver.find_element_by_xpath('//button[contains(text(),"Dismiss All Alerts")]').click()
        assert wait_on_element(driver, 7, '//mat-icon[contains(.,"clear")]', 'clickable')
        driver.find_element_by_xpath('//mat-icon[contains(.,"clear")]').click()


@then('kill a python process with ssh to trigger core files alert')
def kill_a_python_process_with_ssh_to_trigger_core_files_alert(driver, nas_ip, root_password):
    """kill a python process with ssh to trigger core files alert."""
    cmd = 'python3 -c "import os; os.abort()"'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    # Command will failed since kills a process
    assert results['result'] is False, results['output']


@then('wait for the alert and verify the core files warning alert')
def wait_for_the_alert_and_verify_the_core_files_warning_alert(driver):
    """wait for the alert and verify the core files warning alert."""
    assert wait_on_element(driver, 7, '//mat-icon[text()="notifications"]')
    assert wait_on_element(driver, 180, '//span[contains(.,"notifications")]//span[contains(text(),"1")]')
    assert wait_on_element(driver, 7, '//button[contains(.,"notifications")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"notifications")]').click()
    assert wait_on_element(driver, 7, '//h3[text()="Alerts"]')
    assert wait_on_element(driver, 7, '//div[contains(@class, "alert-body")]//h3[contains(.,"Warning")]')
    assert wait_on_element(driver, 7, '//h4[contains(.,"Core files for the following executables were found: /usr/bin/python")]')
    assert wait_on_element(driver, 7, '//ix-alert[contains(.,"Core files")]//mat-icon[text()="warning"]')


@then('click on the core files warning Dismiss and verify it is dismissed')
def click_on_the_core_files_warning_dismiss_and_verify_it_is_dismissed(driver):
    """click on the core files warning Dismiss and verify it is dismissed."""
    assert wait_on_element(driver, 7, '//ix-alert[contains(.,"Core files")]//a[text()="Dismiss"]', 'clickable')
    driver.find_element_by_xpath('//ix-alert[contains(.,"Core files")]//a[text()="Dismiss"]').click()
    assert wait_on_element(driver, 7, '//ix-alert[contains(.,"Core files")]//mat-icon[text()="check_circle"]')


@then('click on the core files warning Re-Open and verify the alert is back')
def click_on_the_core_files_warning_reopen_and_verify_the_alert_is_back(driver):
    """click on the core files warning Re-Open and verify the alert is back."""
    assert wait_on_element(driver, 7, '//ix-alert[contains(.,"Core files")]//a[text()="Re-Open"]', 'clickable')
    driver.find_element_by_xpath('//ix-alert[contains(.,"Core files")]//a[text()="Re-Open"]').click()
    assert wait_on_element(driver, 7, '//ix-alert[contains(.,"Core files")]//mat-icon[text()="warning"]')
    assert wait_on_element(driver, 7, '//button[contains(.,"clear")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"clear")]').click()


@then('after remove the core files in "/var/db/system/cores"')
def after_remove_the_core_files_in_vardbsystemcores(driver, nas_ip, root_password):
    """after remove the core files in "/var/db/system/cores"."""
    cmd = 'rm -f /var/db/system/cores/*'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert results['result'] is True, results['output']


@then('verify that the core file alert disappear')
def verify_that_the_core_file_alert_disappear(driver):
    """verify that the core file alert disappear."""
    assert wait_on_element_disappear(driver, 180, '//span[contains(.,"notifications")]//span[contains(text(),"1")]')
    driver.find_element_by_xpath('//button[contains(.,"notifications")]').click()
    assert wait_on_element(driver, 7, '//h3[text()="Alerts"]')
    assert not is_element_present(driver, '//h4[contains(.,"Core files")]')
    assert wait_on_element(driver, 7, '//button[contains(.,"clear")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"clear")]').click()
    time.sleep(0.5)
    # if wait_on_element(driver, 5, '//div[contains(@class,"mat-drawer-backdrop")]'):
    #    assert wait_on_element_disappear(driver, 20, '//div[contains(@class,"mat-drawer-backdrop")]')
