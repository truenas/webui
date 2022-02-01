# coding=utf-8
"""Core UI feature tests."""

import time
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
    attribute_value_exist
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)


@scenario('features/NAS-T1081.feature', 'Verify dataset Encryption Inheritance')
def test_verify_dataset_encryption_inheritance(driver):
    """Verify dataset Encryption Inheritance."""
    pass


@given('the browser is open, the FreeNAS URL and logged in')
def the_browser_is_open_the_freenas_url_and_logged_in(driver, nas_ip, root_password):
    """the browser is open, the FreeNAS URL and logged in."""
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
        assert wait_on_element(driver, 5, '//button[@name="signin_button"]')
        driver.find_element_by_xpath('//button[@name="signin_button"]').click()
    else:
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Dashboard"]', 'clickable')
        driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Dashboard"]').click()


@when('on the dashboard, click Storage on the side menu and click Pools')
def on_the_dashboard_click_storage_on_the_side_menu_and_click_pools(driver):
    """on the dashboard, click Storage on the side menu and click Pools."""
    assert wait_on_element(driver, 10, '//li[contains(.,"Dashboard")]')
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Storage"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Storage"]').click()
    assert wait_on_element(driver, 5, '//mat-list-item[@ix-auto="option__Pools"]', 'clickable')
    driver.find_element_by_xpath('//mat-list-item[@ix-auto="option__Pools"]').click()


@then('on the Pools page, click on encrypted three dots button, select Add Dataset')
def on_the_pools_page_click_on_encrypted_three_dots_button_select_add_dataset(driver):
    """on the Pools page, click on encrypted three dots button, select Add Dataset."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__encrypted"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__encrypted"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__encrypted_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__encrypted_Add Dataset"]').click()


@then('enter a Name, unset Inherit (encrypted), and unset Encryption')
def enter_a_name_unset_inherit_encrypted_and_unset_encryption(driver):
    """enter a Name, unset Inherit (encrypted), and unset Encryption."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Name and Options")]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('notencrypteddataset')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Inherit (encrypted)"]', 'class', 'mat-checkbox-checked')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Inherit (encrypted)"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Inherit (encrypted)"]').click()
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Encryption"]', 'class', 'mat-checkbox-checked')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Encryption"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Encryption"]').click()


@then('confirm the dataset will be unencrypted click the SUBMIT button')
def confirm_the_dataset_will_be_unencrypted_click_the_submit_button(driver):
    """confirm the dataset will be unencrypted click the SUBMIT button."""
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then('verify that the new dataset is not encrypted')
def verify_that_the_new_dataset_is_not_encrypted(driver):
    """verify that the new dataset is not encrypted."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 7, '//td[@id="tbody__name_encrypted"]/span/span/mat-icon')
    time.sleep(0.5)
    assert attribute_value_exist(driver, '//td[@id="tbody__name_encrypted"]/span/span/mat-icon', 'fonticon', 'mdi-lock-open-variant')
    assert wait_on_element(driver, 7, '//td[contains(.,"notencrypteddataset")]/span/span/mat-icon')
    assert attribute_value_exist(driver, '//td[contains(.,"notencrypteddataset")]/span/span/mat-icon', 'svgicon', 'anti-lock')


@then('click on tank three dots button, select Add Dataset')
def on_the_pools_page_click_on_tank_three_dots_button_select_add_dataset(driver):
    """on the Pools page, click on tank three dots button, select Add Dataset."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__tank"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__tank"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__tank_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__tank_Add Dataset"]').click()


@then('enter a Name, unset Inherit (non-encrypted)')
def enter_a_name_unset_inherit_nonencrypted(driver):
    """enter a Name, unset Inherit (non-encrypted)."""
    assert wait_on_element(driver, 5, '//h4[contains(.,"Name and Options")]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('encrypteddataset')
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Inherit (non-encrypted)"]', 'clickable')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Inherit (non-encrypted)"]', 'class', 'mat-checkbox-checked')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Inherit (non-encrypted)"]').click()


@then('confirm Encryption and Generate Key is set and click the SUBMIT button')
def confirm_encryption_and_generate_key_is_set_and_click_the_submit_button(driver):
    """confirm Encryption and Generate Key is set and click the SUBMIT button."""
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Encryption"]', 'clickable')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Encryption"]', 'class', 'mat-checkbox-checked')
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Generate Key"]', 'clickable')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Generate Key"]', 'class', 'mat-checkbox-checked')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SUBMIT"]')
    driver.find_element_by_xpath('//button[@ix-auto="button__SUBMIT"]').click()
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')


@then('verify that the new dataset is encrypted')
def verify_that_the_new_dataset_is_encrypted(driver):
    """verify that the new dataset is encrypted."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 7, '//td[contains(.,"tank")]/span/span/mat-icon')
    time.sleep(0.5)
    assert attribute_value_exist(driver, '//td[contains(.,"tank")]/span/span/mat-icon', 'svgicon', 'anti-lock')
    assert wait_on_element(driver, 7, '//td[@id="tbody__name_encrypteddataset"]/span/span/mat-icon')
    assert attribute_value_exist(driver, '//td[@id="tbody__name_encrypteddataset"]/span/span/mat-icon', 'fonticon', 'mdi-lock-open-variant')
