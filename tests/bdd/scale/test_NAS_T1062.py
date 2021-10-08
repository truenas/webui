# coding=utf-8
"""SCALE UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    attribute_value_exist,
    wait_for_attribute_value,
    wait_on_element_disappear,
    ssh_cmd,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1062.feature', 'Verify SSH Access with root works')
def test_verify_ssh_access_with_root_works(driver):
    """Verify SSH Access with root works."""
    pass


@given('the browser is open, navigate to the SCALE URL, and login')
def the_browser_is_open_navigate_to_the_scale_url(driver, nas_ip, root_password):
    """the browser is open, navigate to the SCALE URL."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, verify the Welcome box is loaded, click Close')
def on_the_dashboard_verify_the_welcome_box_is_loaded_click_close(driver):
    """on the dashboard, verify the Welcome box is loaded, click Close."""
    time.sleep(2)
    if wait_on_element(driver, 5, '//div[contains(.,"Looking for help?")]'):
        assert wait_on_element(driver, 10, '//button[@ix-auto="button__CLOSE"]')
        driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    #assert wait_on_element(driver, 5, '//div[contains(.,"Welcome to your new NAS")]')
    #assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    #driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('on the dashboard click on the System Settings side menu, then click services')
def on_the_dashboard_click_on_the_system_settings_side_menu_then_click_services(driver):
    """on the dashboard click on the System Settings side menu, then click services."""
    assert wait_on_element(driver, 10, '//span[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__System Settings"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Settings"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 10, '//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]', 'clickable')
    driver.find_element_by_xpath('//*[contains(@class,"lidein-nav-md")]//mat-list-item[@ix-auto="option__Services"]').click()


@then('on the service page, press on configure(pencil) SSH')
def on_the_service_page_press_on_configurepencil_ssh(driver):
    """on the service page, press on configure(pencil) SSH."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__Configure_DYNAMICDNS"]')
    element = driver.find_element_by_xpath('//button[@ix-auto="action__Configure_DYNAMICDNS"]')
    # Scroll to SSH service
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(1)
    driver.find_element_by_xpath('//button[@ix-auto="action__Configure_SSH"]').click()


@then('the SSH General Options page should open')
def the_ssh_general_options_page_should_open(driver):
    """the SSH General Options page should open."""
    assert wait_on_element(driver, 5, '//h4[contains(text(),"General Options")]')


@then('click the checkbox "Log in as root with password"')
def click_the_checkbox_log_in_as_root_with_password(driver):
    """click the checkbox "Log in as root with password"."""
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Log in as Root with Password"]', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Log in as Root with Password"]').click()


@then('verify the checkbox works and click Save')
def verify_the_checkbox_works_and_click_save(driver):
    """verify the checkbox works and click Save."""
    wait_for_value = wait_for_attribute_value(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Log in as Root with Password"]', 'class', 'mat-checkbox-checked')
    assert wait_for_value
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    wait_on_element_disappear(driver, 10, '//h6[contains(.,"Please wait")]')


@then('click the Start Automatically SSH checkbox and enable the SSH service')
def click_the_start_automatically_ssh_checkbox_and_enable_the_ssh_service(driver):
    """click the Start Automatically SSH checkbox and enable the SSH service."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__Configure_DYNAMICDNS"]')
    # Scroll to SSH service
    element = driver.find_element_by_xpath('//button[@ix-auto="action__Configure_DYNAMICDNS"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(1)
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__enable__SSH"]', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__enable__SSH"]').click()
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__state__SSH"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__stateSSH"]').click()
    time.sleep(1)


@then('the service should be enabled with no errors')
def the_service_should_be_enabled_with_no_errors(driver):
    """the service should be enabled with no errors."""
    assert wait_on_element(driver, 20, '//div[@id="overlay__SSH_Running"]')


@then('ssh to a NAS with root and the root password should work')
def ssh_to_a_nas_with_root_and_the_root_password_should_work(driver, root_password, nas_ip):
    """ssh to a NAS with root and the root password should work."""
    global ssh_result
    ssh_result = ssh_cmd('ls', 'root', root_password, nas_ip)
    assert ssh_result['result'], ssh_result['output']
    assert 'syslog' in ssh_result['output'], ssh_result['output']
