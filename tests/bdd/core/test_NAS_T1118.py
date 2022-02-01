# coding=utf-8
"""Core UI feature tests."""

from selenium.webdriver.common.keys import Keys
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


@scenario('features/NAS-T1118.feature', 'Verify Amazon S3 credentials can be added')
def test_verify_amazon_s3_credentials_can_be_added(driver):
    """Verify Amazon S3 credentials can be added."""
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
    """on the dashboard, click system on the left sidebar, then click on Cloud Credentials."""
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


@then(parsers.parse('input {account_name} as Name, select Amazon S3 has Provider'))
def input_account_name_as_name_select_amazon_s3_has_provider(driver, account_name):
    """input account_name as Name, select Amazon S3 has Provider."""
    assert wait_on_element(driver, 5, '//li[contains(.,"Add")]')
    assert wait_on_element(driver, 5, '//input[@placeholder="Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Name"]').send_keys(account_name)
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Provider"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Provider"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Provider_Amazon S3"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Provider_Amazon S3"]').click()


@then(parsers.parse('input "{key_id}" as for Access Key ID'))
def input_key_id_as_for_access_key_id(driver, key_id):
    """input "{key_id}" as for Access Key ID."""
    global keyid
    keyid = key_id
    assert wait_on_element(driver, 5, '//input[@placeholder="Access Key ID"]')
    driver.find_element_by_xpath('//input[@placeholder="Access Key ID"]').send_keys(key_id)


@then(parsers.parse('input "{access_key}" as Secret Access Key'))
def input_access_key_as_secret_access_key(driver, access_key):
    """input "{access_key}" as Secret Access Key."""
    assert wait_on_element(driver, 5, '//input[@placeholder="Secret Access Key"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Secret Access Key"]').send_keys(access_key)


@then('click Verify Credential to verify it is valid')
def click_verify_credential_to_verify_it_is_valid(driver):
    """click Verify Credential to verify it is valid."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__VERIFY CREDENTIAL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__VERIFY CREDENTIAL"]').click()
    assert wait_on_element_disappear(driver, 20, '//h1[contains(.,"Please wait")]')
    assert wait_on_element(driver, 20, '//h1[normalize-space(text())="Valid"]')
    assert wait_on_element(driver, 10, '//textarea[text()="The Credential is valid."]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then(parsers.parse('click Summit, {account_name} should be added to the list'))
def click_summit_account_name_should_be_added_to_the_list(driver, account_name):
    """click Summit, account_name should be added to the list."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SUBMIT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 30, '//h1[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//div[normalize-space(text())="amazons3creds"]')


@then(parsers.parse('click on three dots of {account_name} and select Edit'))
def click_on_three_dots_of_account_name_and_select_edit(driver, account_name):
    """click on three dots of account_name and select Edit."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="amazons3creds__button"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="amazons3creds__button"]').click()
    assert wait_on_element(driver, 5, '//button[@id="action_button_edit__edit"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="action_button_edit__edit"]').click()


@then('remove the last character from Access Key ID')
def remove_the_last_character_from_access_key_id(driver):
    """remove the last character from Access Key ID."""
    assert wait_on_element(driver, 5, '//input[@placeholder="Access Key ID"]')
    driver.find_element_by_xpath('//input[@placeholder="Access Key ID"]').send_keys(Keys.BACKSPACE)


@then('click Verify Credential to verify the key id is invalid')
def click_verify_credential_to_verify_the_key_id_is_invalid(driver):
    """click Verify Credential to verify the key id is invalid."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__VERIFY CREDENTIAL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__VERIFY CREDENTIAL"]').click()
    assert wait_on_element_disappear(driver, 20, '//h1[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[normalize-space(text())="Error"]')
    assert wait_on_element(driver, 10, '//span[contains(.,"InvalidAccessKeyId:")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()


@then('correct the Access Key ID then remove the last character from Secret Access Key')
def correct_access_key_id_then_remove_the_last_character_from_secret_access_key(driver):
    """Correct Access Key ID then remove the last character from Secret Access Key."""
    assert wait_on_element(driver, 5, '//input[@placeholder="Access Key ID"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Access Key ID"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Access Key ID"]').send_keys(keyid)
    assert wait_on_element(driver, 10, '//input[@placeholder="Secret Access Key"]')
    driver.find_element_by_xpath('//input[@placeholder="Secret Access Key"]').send_keys(Keys.BACKSPACE)


@then('click Verify Credential to verify the access key is invalid')
def click_verify_credential_to_verify_the_access_key_is_invalid(driver):
    """click Verify Credential to verify the access key is invalid."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__VERIFY CREDENTIAL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__VERIFY CREDENTIAL"]').click()
    assert wait_on_element_disappear(driver, 20, '//h1[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//h1[normalize-space(text())="Error"]')
    assert wait_on_element(driver, 10, '//span[contains(.,"SignatureDoesNotMatch:")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
