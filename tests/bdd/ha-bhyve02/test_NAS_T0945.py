# coding=utf-8
"""High Availability (tn09) feature tests."""

import time
from function import (
    is_element_present,
    wait_on_element,
    wait_for_attribute_value,
    attribute_value_exist,
    ssh_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)


@scenario('features/NAS-T945.feature', 'Verify SSH Access with Root works')
def test_verify_ssh_access_with_root_works(driver):
    """Verify SSH Access with Root works."""


@given(parsers.parse('the browser is open navigate to "{nas_url}"'))
def the_browser_is_open_navigate_to_nas_url(driver, nas_url):
    """the browser is open navigate to "{nas_url}"."""
    if nas_url not in driver.current_url:
        driver.get(f"{nas_url}/ui/sessions/signin")
        time.sleep(5)


@when(parsers.parse('login appear enter "{user}" and "{password}"'))
def login_appear_enter_root_and_password(driver, user, password):
    """login appear enter "{user}" and "{password}"."""
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 1, 10, '//input[@data-placeholder="Username"]')
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Username"]').send_keys(user)
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@data-placeholder="Password"]').send_keys(password)
        assert wait_on_element(driver, 0.5, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@then('you should see the dashboard')
def you_should_see_the_dashboard(driver):
    """you should see the dashboard."""
    assert wait_on_element(driver, 1, 10, '//button[@ix-auto="button__CLOSE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 1, 5, '//button[@ix-auto="button__I AGREE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__I AGREE"]').click()
    assert wait_on_element(driver, 0.5, 5, '//span[contains(.,"System Information")]')


@then('go to System Settings, click Services')
def go_to_system_settings_click_services(driver):
    """go to System Settings, click Services."""
    assert wait_on_element(driver, 0.5, 5, '//mat-list-item[@ix-auto="option__System Settings"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System Settings"]').click()
    assert wait_on_element(driver, 0.5, 5, '//mat-list-item[@ix-auto="option__Services"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Services"]').click()


@then('the service page should open')
def the_service_page_should_open(driver):
    """the service page should open."""
    assert wait_on_element(driver, 1, 5, '//services')


@then('press on configure(pencil) SSH')
def press_on_configure_ssh(driver):
    """press on configure(pencil) SSH."""
    assert wait_on_element(driver, 0.5, 5, '//button[@ix-auto="button__S3_Actions"]')
    # Scroll to SSH service
    element = driver.find_element_by_xpath('//button[@ix-auto="button__S3_Actions"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(1)
    driver.find_element_by_xpath('//button[@ix-auto="button__SSH_Actions"]').click()


@then('the SSH General Options page should open')
def the_ssh_general_options_page_should_open(driver):
    """the SSH General Options page should open."""
    assert wait_on_element(driver, 0.5, 5, '//h4[contains(text(),General) and contains(text(),Options)]')
    driver.find_element_by_xpath('//h4[contains(text(),General) and contains(text(),Options)]')


@then('click the checkbox "Log in as root with password"')
def click_the_checkbox_log_in_as_root_with_password(driver):
    """click the checkbox "Log in as root with password"."""
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Log in as Root with Password"]', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Log in as Root with Password"]').click()
    wait_for_value = wait_for_attribute_value(driver, 0.5, 5, '//mat-checkbox[@ix-auto="checkbox__Log in as Root with Password"]', 'class', 'mat-checkbox-checked')
    assert wait_for_value


@then('click Save')
def click_save(driver):
    """click Save."""
    assert wait_on_element(driver, 0.5, 5, '//button[@ix-auto="button__SAVE"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()


@then('click Start Automatically SSH checkbox and enable the SSH service')
def click_start_automatically_ssh_checkbox_and_enable_the_ssh_service(driver):
    """click Start Automatically SSH checkbox and enable the SSH service."""
    assert wait_on_element(driver, 1, 5, '//services')
    assert wait_on_element(driver, 1, 5, '//button[@ix-auto="button__S3_Actions"]')
    # Scroll to SSH service
    element = driver.find_element_by_xpath('//button[@ix-auto="button__S3_Actions"]')
    driver.execute_script("arguments[0].scrollIntoView();", element)
    time.sleep(1)
    driver.find_element_by_xpath('//div[@ix-auto="value__SSH"]')
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__SSH_Start Automatically"]', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__SSH_Start Automatically"]').click()
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__SSH_Running"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__SSH_Running"]').click()
    time.sleep(1)


@then('the service should be enabled with no errors')
def the_service_should_be_enabled_with_no_errors(driver):
    """the service should be enabled with no errors."""
    wait_for_value = wait_for_attribute_value(driver, 1, 7, '//mat-slide-toggle[@ix-auto="slider__SSH_Running"]', 'class', 'mat-checked')
    assert wait_for_value
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()
    time.sleep(3)


@then(parsers.parse('run ssh root@"{host}" with root password "{password}"'))
def run_ssh_root_host_with_root_password(driver, host, password):
    """run ssh root@"{host}" with root password "{password}"."""
    global ssh_result
    ssh_result = ssh_cmd('ls -la', 'root', password, host)


@then('the root user should be able to login with ssh')
def the_root_user_should_be_able_to_login_with_ssh(driver):
    """the root user should be able to login with ssh."""
    assert ssh_result['result'], ssh_result['output']
    assert '..' in ssh_result['output'], ssh_result['output']
