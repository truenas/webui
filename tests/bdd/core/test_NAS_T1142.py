# coding=utf-8
"""Core UI feature tests."""

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


@scenario('features/NAS-T1142.feature', 'Verify Backblaze B2 credentials can be added')
def test_verify_backblaze_b2_credentials_can_be_added(driver):
    """Verify Backblaze B2 credentials can be added."""
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
    else:
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
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


@then(parsers.parse('input {account_name} as Name, select Backblaze B2 has Provider'))
def input_account_name_as_name_select_backblaze_b2_has_provider(driver, account_name):
    """input account_name as Name, select backblaze B2 has Provider."""
    assert wait_on_element(driver, 5, '//li[contains(.,"Add")]')
    assert wait_on_element(driver, 5, '//input[@placeholder="Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Name"]').send_keys(account_name)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Provider"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Provider"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Provider_Backblaze B2"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Provider_Backblaze B2"]').click()


@then('input the <key_id> and input the <application_key>')
def input_the_key_id_and_input_the_application_key(driver, key_id, application_key):
    """input the <key_id> and input the <application_key>."""
    assert wait_on_element(driver, 5, '//input[@placeholder="Key ID"]')
    driver.find_element_by_xpath('//input[@placeholder="Key ID"]').send_keys(key_id)
    assert wait_on_element(driver, 5, '//input[@placeholder="Application Key"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Application Key"]').send_keys(application_key)


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
    assert wait_on_element(driver, 10, f'//div[normalize-space(text())="{account_name}"]')
