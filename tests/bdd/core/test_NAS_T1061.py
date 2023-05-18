# coding=utf-8
"""Core UI feature tests."""

import time
import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist,
    wait_for_attribute_value,
    run_cmd
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when
)


@scenario('features/NAS-T1061.feature', 'Verify Root FTP Login Access')
def test_verify_root_ftp_login_access(driver):
    """Verify Root FTP Login Access."""
    assert wait_on_element(driver, 7, '//li[contains(.,"Services")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__FTP_Actions"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__FTP_Actions"]').click()
    assert wait_on_element(driver, 7, '//li[contains(.,"FTP")]')
    assert wait_on_element(driver, 7, xpaths.button.advanced_options, 'clickable')
    driver.find_element_by_xpath(xpaths.button.advanced_options).click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Access")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Allow Root Login"]', 'clickable')
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Allow Root Login"]', 'class', 'mat-checkbox-checked')
    if value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Allow Root Login"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@given('the browser is open on the TrueNAS URL and logged in')
def the_browser_is_open_on_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open on the TrueNAS URL and logged in."""
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        time.sleep(1)
    if not is_element_present(driver, '//mat-list-item[@ix-auto="option__Dashboard"]'):
        assert wait_on_element(driver, 10, '//input[@placeholder="Username"]')
        driver.find_element_by_xpath('//input[@placeholder="Username"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Username"]').send_keys('root')
        driver.find_element_by_xpath('//input[@placeholder="Password"]').clear()
        driver.find_element_by_xpath('//input[@placeholder="Password"]').send_keys(root_password)
        assert wait_on_element(driver, 4, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(1)
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click on service on the side menu')
def on_the_dashboard_click_on_service_on_the_side_menu(driver):
    """on the dashboard, click on service on the side menu."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 10, '//mat-list-item[@ix-auto="option__Services"]')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Services"]').click()


@then('on the Service page, click on the FTP pencil')
def on_the_service_page_click_on_the_ftp_pencil(driver):
    """on the Service page, click on the FTP pencil."""
    assert wait_on_element(driver, 7, '//li[contains(.,"Services")]')
    assert wait_on_element(driver, 7, '//button[@ix-auto="button__FTP_Actions"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__FTP_Actions"]').click()


@then('on the FTP edit page, enable the "Allow Root Login" checkbox and confirm')
def on_the_ftp_edit_page_enable_the_allow_root_login_checkbox_and_confirm(driver):
    """on the FTP edit page, enable the "Allow Root Login" checkbox and confirm."""
    assert wait_on_element(driver, 7, '//li[contains(.,"FTP")]')
    assert wait_on_element(driver, 7, xpaths.button.advanced_options, 'clickable')
    driver.find_element_by_xpath(xpaths.button.advanced_options).click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Access")]')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Allow Root Login"]', 'clickable')
    value_exist = attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Allow Root Login"]', 'class', 'mat-checkbox-checked')
    if not value_exist:
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Allow Root Login"]').click()
        assert wait_on_element(driver, 7, '//h1[contains(.,"Allow Root Login")]')
        assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
        driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
        assert wait_on_element(driver, 7, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
        driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()


@then('click Save. All changes should save without error')
def click_save_all_changes_should_save_without_error(driver):
    """click Save. All changes should save without error."""
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then('on the service page, if the FTP service isn\'t running, start it')
def on_the_service_page_if_the_ftp_service_isnt_running_start_it(driver):
    """on the service page, if the FTP service isn't running, start it."""
    assert wait_on_element(driver, 7, '//div[@ix-auto="overlay__FTP_Running"]', 'clickable')
    value_exist = attribute_value_exist(driver, '//mat-slide-toggle[@ix-auto="slider__FTP_Running"]', 'class', 'mat-checked')
    if not value_exist:
        driver.find_element_by_xpath('//div[@ix-auto="overlay__FTP_Running"]').click()
    time.sleep(1)
    wait_for_value = wait_for_attribute_value(driver, 10, '//mat-slide-toggle[@ix-auto="slider__FTP_Running"]', 'class', 'mat-checked')
    assert wait_for_value


@then('with wget, verify login work with the root user and password')
def with_wget_verify_login_work_with_the_root_user_and_password(driver, nas_ip):
    """with wget, verify login work with the root user and password."""
    results = run_cmd(f'wget --user=root --password=testing ftp://{nas_ip}')
    assert results['result'], results['output']


@then('verify login do not work with the root user and wrong password')
def verify_login_do_not_work_with_the_root_user_and_wrong_password(driver, nas_ip):
    """verify login do not work with the root user and wrong password."""
    results = run_cmd(f'wget --user=root --password=wrongpasswd ftp://{nas_ip}')
    assert not results['result'], results['output']


@then('verify login do not work with the ftpuser user and password')
def verify_login_do_not_work_with_the_ftpuser_user_and_password(driver, nas_ip):
    """verify login do not work with the ftpuser user and password."""
    results = run_cmd(f'wget --user=ftpuser --password=testing ftp://{nas_ip}')
    assert not results['result'], results['output']
