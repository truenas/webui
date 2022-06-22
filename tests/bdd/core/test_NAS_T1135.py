# coding=utf-8
"""Core UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)

import pytest
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1135.feature', 'Verify Dropbox credentials can be added')
def test_verify_dropbox_credentials_can_be_added(driver):
    """Verify Dropbox credentials can be added."""
    pass


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
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click System on the left sidebar, then click on Cloud Credentials')
def on_the_dashboard_click_system_on_the_left_sidebar_then_click_on_cloud_credentials(driver):
    """on the dashboard, click System on the left sidebar, then click on Cloud Credentials."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__System"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__System"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Cloud Credentials"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Cloud Credentials"]').click()


@then('on the Cloud Credentials page, click Add')
def on_the_cloud_credentials_page_click_add(driver):
    """on the Cloud Credentials page, click Add."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Cloud Credentials")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__Cloud Credentials_ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__Cloud Credentials_ADD"]').click()


@then(parsers.parse('input {account_name} as Name, select Dropbox has Provider'))
def input_account_name_as_name_select_dropbox_has_provider(driver, account_name):
    """input account_name as Name, select Dropbox has Provider."""
    assert wait_on_element(driver, 5, '//li[contains(.,"Add")]')
    assert wait_on_element(driver, 5, '//input[@placeholder="Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Name"]').send_keys(account_name)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Provider"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Provider"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Provider_Dropbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Provider_Dropbox"]').click()


@then('click on Login to Provider Authorization box will appear')
def click_on_login_to_provider_authorization_box_will_appear(driver):
    """click on Login to Provider Authorization box will appear."""
    assert wait_on_element(driver, 5, '//button[@id="cust_button_LOGIN TO PROVIDER"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="cust_button_LOGIN TO PROVIDER"]').click()
    driver.switch_to.window(driver.window_handles[1])
    assert wait_on_element(driver, 10, '//h1[text()="Authorization"]')


@then('click Proceed, then enter the login <user_name> and <password>')
def click_proceed_then_enter_the_login_user_name_and_password(driver, user_name, password):
    """click Proceed, then enter the login <user_name> and <password>."""
    assert wait_on_element(driver, 10, '//a[text()="Proceed"]', 'clickable')
    driver.find_element_by_xpath('//a[text()="Proceed"]').click()
    assert wait_on_element(driver, 10, '//div[@class="login-header" and contains(.,"Sign in to Dropbox to link with TrueNAS CloudSync")]')
    assert wait_on_element(driver, 5, '//button[contains(.,"Sign in with Google")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Sign in with Google")]').click()
    assert wait_on_element(driver, 10, '//div[text()="Sign in with Google"]')
    assert wait_on_element(driver, 5, '//span[text()="Sign in"]')
    assert wait_on_element(driver, 5, '//input[@id="identifierId"]', 'inputable')
    driver.find_element_by_xpath('//input[@id="identifierId"]').send_keys(user_name)
    time.sleep(1)
    assert wait_on_element(driver, 5, '//button[contains(.,"Next")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Next")]').click()
    assert wait_on_element(driver, 10, '//div[text()="Sign in with Google"]')
    assert wait_on_element(driver, 5, '//span[text()="Welcome"]')
    assert wait_on_element(driver, 5, '//input[@type="password"]', 'inputable')
    driver.find_element_by_xpath('//input[@type="password"]').send_keys(password)
    time.sleep(1)
    assert wait_on_element(driver, 5, '//button[contains(.,"Next")]', 'clickable')
    driver.find_element_by_xpath('//button[contains(.,"Next")]').click()
    while len(driver.window_handles) != 1:
        time.sleep(1)
    driver.switch_to.window(driver.window_handles[0])


@then('verify Access Token, OAuth Client ID and OAuth Client Secret')
def verify_access_token_oauth_client_id_and_oauth_client_secret(driver):
    """verify Access Token, OAuth Client ID and OAuth Client Secret."""
    assert wait_on_element(driver, 5, '//input[@placeholder="Access Token"]', 'inputable')
    element1 = driver.find_element_by_xpath('//input[@placeholder="Access Token"]')
    assert element1.get_attribute('value') != '', element1.get_attribute('value')
    element2 = driver.find_element_by_xpath('//input[@placeholder="OAuth Client ID"]')
    assert element2.get_attribute('value') != '', element2.get_attribute('value')
    element3 = driver.find_element_by_xpath('//input[@placeholder="OAuth Client Secret"]')
    assert element3.get_attribute('value') != '', element3.get_attribute('value')


@then('click Verify Credential to verify it is valid')
def click_verify_credential_to_verify_it_is_valid(driver):
    """click Verify Credential to verify it is valid."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__VERIFY CREDENTIAL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__VERIFY CREDENTIAL"]').click()
    assert wait_on_element_disappear(driver, 20, '//h1[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[normalize-space(text())="Valid"]')
    assert wait_on_element(driver, 10, '//textarea[text()="The Credential is valid."]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then(parsers.parse('click Summit, {account_name} should be added to the list'))
def click_summit_account_name_should_be_added_to_the_list(driver, account_name):
    """click Summit, account_name should be added to the list."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 30, '//h1[contains(.,"Please wait")]')
    assert wait_on_element(driver, 5, f'//div[normalize-space(text())="{account_name}"]')
