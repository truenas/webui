# coding=utf-8
"""Core UI feature tests."""

import time
from selenium.webdriver import ActionChains
from selenium.webdriver.common.keys import Keys
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_on_element_disappear,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1222.feature', 'Verify core file alert works')
def test_verify_corefile_alerts_works(driver):
    """Verify corefile alerts works."""


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    if is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard click on service on the side menu')
def on_the_dashboard_click_on_service_on_the_side_menu(driver):
    """on the dashboard click on service on the side menu."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')
    if wait_on_element(driver, 5, '//div[contains(.,"Looking for help?")]'):
        assert wait_on_element(driver, 10, '//button[@ix-auto="button__CLOSE"]')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Services"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Services"]').click()


@then('on the Service page, if the SMB service is not started, start it')
def on_the_service_page_if_the_smb_service_is_not_started_start_it(driver):
    """on the Service page, if the SMB service is not started, start it."""
    assert wait_on_element(driver, 7, '//services')
    assert wait_on_element(driver, 10, '//li[contains(.,"Services")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__S3_Actions"]')
    # Scroll to SMB service
    element = driver.find_element_by_xpath('//button[@ix-auto="button__S3_Actions"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(1)
    driver.find_element_by_xpath('//div[@ix-auto="value__SMB"]')
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__SMB_Running"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__SMB_Running"]').click()
    time.sleep(1)


@then('kill all smbd with ssh to trigger core files alert')
def kill_all_smbd_with_ssh_to_trigger_core_files_alert(driver, nas_ip, root_password):
    """kill all smbd with ssh to trigger core files alert."""
    cmd = 'killall -6 smbd'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert results['result'] is True, results['output']
    time.sleep(1)


@then('go back to the dashboard')
def go_back_to_the_dashboard(driver):
    """go back to the dashboard."""
    element = driver.find_element_by_xpath('//span[contains(.,"root")]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    assert wait_on_element(driver, 7, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')


@then('wait for the alert and verify the core files warning alert')
def wait_for_the_alert_and_verify_the_core_files_warning_alert(driver):
    """wait for the alert and verify the core files warning alert."""
    assert wait_on_element(driver, 10, '//span[contains(.,"System Information")]')
    assert wait_on_element(driver, 7, '//mat-icon[text()="notifications"]')
    assert wait_on_element(driver, 180, '//span[contains(@class,"notification-number")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__notifications"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__notifications"]').click()
    assert wait_on_element(driver, 7, '//h6[contains(.,"Alerts")]')
    assert wait_on_element(driver, 7, '//h3[contains(.,"WARNING")]')
    assert wait_on_element(driver, 7, '//h4[contains(.,"The following system core files were found: smbd.core.")]')
    assert wait_on_element(driver, 7, '//mat-icon[text()="warning"]')


@then('click on the core files warning Dismiss and verify it is dismissed')
def click_on_the_core_files_warning_dismiss_and_verify_it_is_dismissed(driver):
    """click on the core files warning Dismiss and verify it is dismissed."""
    assert wait_on_element(driver, 7, '//a[@class="dismiss" and text()="Dismiss"]', 'clickable')
    driver.find_element_by_xpath('//a[@class="dismiss" and text()="Dismiss"]').click()
    assert wait_on_element(driver, 7, '//mat-icon[@mattooltip="DISMISSED"]', 'clickable')


@then('click on the core files warning Re-Open and verify the alert is back')
def click_the_core_files_warning_re_open_and_verify_the_alert_is_back(driver):
    """click on the core files warning Re-Open and verify the alert is back."""
    assert wait_on_element(driver, 7, '//a[@class="dismiss" and text()="Re-Open"]', 'clickable')
    driver.find_element_by_xpath('//a[@class="dismiss" and text()="Re-Open"]').click()
    assert wait_on_element(driver, 7, '//mat-icon[text()="warning"]')
    ActionChains(driver).send_keys(Keys.ESCAPE).perform()


@then('after remove the the core files in "/var/db/system/cores"')
def after_remove_the_the_core_files_in_var_db_system_cores(driver, nas_ip, root_password):
    """after remove the the core files in "/var/db/system/cores"."""
    cmd = 'rm -f /var/db/system/cores/*'
    results = ssh_cmd(cmd, 'root', root_password, nas_ip)
    assert results['result'] is True, results['output']
    time.sleep(1)


@then('verify that the core file alert disappear')
def verify_that_the_core_file_alert_disappear(driver):
    """verify that the core file alert disappear."""
    assert wait_on_element_disappear(driver, 180, '//span[contains(@class,"notification-number")]')
