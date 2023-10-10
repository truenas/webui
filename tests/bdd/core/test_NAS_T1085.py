# coding=utf-8
"""Core UI feature tests."""

import glob
import os
import time
import reusableSeleniumCode as rsc
import xpaths
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
import pytest
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1085.feature', 'Verify that changing an encryption key format to PASSPHRASE functions')
def test_core_ui_verify_that_changing_an_encryption_key_format_to_passphrase_functions(driver):
    """Core UI: Verify that changing an encryption key format to PASSPHRASE functions."""
    for file in glob.glob('/tmp/dataset_encrypted_keys*.json'):
        os.remove(file)


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
    if not is_element_present(driver, '//li[contains(.,"Dashboard")]'):
        rsc.scroll_To(driver, xpaths.sideMenu.root)
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


@then('on the Pools page, click Add')
def on_the_pools_page_click_add(driver):
    """on the Pools page, click Add."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button___ADD"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button___ADD"]').click()


@then('select Create new pool Click create a pool')
def select_create_new_pool_click_create_a_pool(driver):
    """select Create new pool Click create a pool."""
    assert wait_on_element(driver, 5, '//label[contains(.,"Create a pool:")]')
    assert wait_on_element(driver, 5, '//mat-radio-button[@ix-auto="radio__is_new_Create new pool"]', 'clickable')
    driver.find_element_by_xpath('//mat-radio-button[@ix-auto="radio__is_new_Create new pool"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CREATE POOL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


@then('on the Pool Manager, enter encryptedpool for pool name')
def on_the_pool_manager_enter_encryptedpool_for_pool_name(driver):
    """on the Pool Manager, enter encryptedpool for pool name."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pool Manager")]')
    assert wait_on_element(driver, 5, '//input[@placeholder="Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Name"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Name"]').send_keys('encryptedpool')


@then('click on the Encryption checkbox, then confirm')
def click_on_the_encryption_checkbox_then_confirm(driver):
    """click on the Encryption checkbox, then confirm."""
    assert wait_on_element(driver, 5, '//mat-checkbox[@id="pool-manager__encryption-checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__encryption-checkbox"]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__I UNDERSTAND"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__I UNDERSTAND"]').click()


@then('click the ada2 checkbox, press the right arrow under Data VDevs')
def click_the_ada2_checkbox_press_the_right_arrow_under_data_vdevs(driver):
    """click the ada2 checkbox, press the right arrow under Data VDevs."""
    assert wait_on_element(driver, 5, '//mat-checkbox[@id="pool-manager__disks-ada2"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__disks-ada2"]').click()
    assert wait_on_element(driver, 5, '//button[@id="vdev__add-button"]')
    driver.find_element_by_xpath('//button[@id="vdev__add-button"]').click()


@then('click on the force checkbox, then confirm')
def click_on_the_force_checkbox_then_confirm(driver):
    """click on the force checkbox, then confirm."""
    assert wait_on_element(driver, 5, '//mat-checkbox[@id="pool-manager__force-submit-checkbox"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@id="pool-manager__force-submit-checkbox"]').click()
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()


@then('click create on the Warning widget, click confirm checkbox, click CREATE POOL')
def click_create_on_the_warning_widget_click_confirm_checkbox_click_create_pool(driver):
    """click create on the Warning widget, click confirm checkbox, click CREATE POOL."""
    assert wait_on_element(driver, 5, '//button[@name="create-button"]')
    driver.find_element_by_xpath('//button[@name="create-button"]').click()
    assert wait_on_element(driver, 5, '//h1[contains(.,"Warning")]')
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CREATE POOL"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CREATE POOL"]').click()


@then('Create pool should appear while the pool is being created')
def create_pool_should_appear_while_the_pool_is_being_created(driver):
    """Create pool should appear while the pool is being created."""
    assert wait_on_element(driver, 10, '//h1[contains(.,"Create Pool")]')


@then('click Download Encryption Key, save it, then click Done')
def click_download_encryption_key_save_it_then_click_done(driver):
    """click Download Encryption Key, save it, then click Done."""
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__DOWNLOAD ENCRYPTION KEY"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__DOWNLOAD ENCRYPTION KEY"]').click()
    assert wait_on_element(driver, 10, '//button[@ix-auto="button__DONE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__DONE"]').click()
    assert wait_on_element_disappear(driver, 10, '//h1[contains(.,"Create Pool")]')


@then('the new encrypted pool should appear in the pools list')
def the_new_encrypted_pool_should_appear_in_the_pools_list(driver):
    """the new encrypted pool should appear in the pools list."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 5, '//mat-panel-title[contains(.,"encryptedpool")]')


@then('click on the three dots button for the encrypted pool, select Encryption Options')
def click_on_the_three_dots_button_for_the_encrypted_pool_select_encryption_options(driver):
    """click on the three dots button for the encrypted pool, select Encryption Options."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__encryptedpool"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__encryptedpool"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__encryptedpool_Encryption Options"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__encryptedpool_Encryption Options"]').click()


@then('switch the encryption type from Key to Passphrase, enter your passphrase')
def switch_the_encryption_type_from_key_to_passphrase_enter_your_passphrase(driver):
    """switch the encryption type from Key to Passphrase, enter your passphrase."""
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Encryption Type"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Encryption Type"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Encryption Type_Passphrase"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Encryption Type_Passphrase"]').click()
    assert wait_on_element(driver, 5, '//input[@placeholder="Passphrase"]')
    driver.find_element_by_xpath('//input[@placeholder="Passphrase"]').send_keys('abcd1234')
    driver.find_element_by_xpath('//input[@placeholder="Confirm Passphrase"]').send_keys('abcd1234')


@then('leave the pbkdf2iters at 350000, and click the Save button')
def leave_the_pbkdf2iters_at_350000_and_click_the_save_button(driver):
    """leave the pbkdf2iters at 350000, and click the Save button."""
    assert attribute_value_exist(driver, '//input[@placeholder="pbkdf2iters"]', 'value', '350000')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Confirm"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__SAVE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__SAVE"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Encryption Options Saved")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 10, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 7, '//mat-panel-title[contains(.,"encryptedpool")]')


@then('verify that pool has an unlock icon')
def verify_that_pool_has_a_unlock_icon(driver):
    """verify that pool has a unlock icon."""
    assert wait_on_element(driver, 7, '//mat-icon[@fonticon="mdi-lock-open-variant"]')


@then('click on the three dots next to the pool and select Lock')
def click_on_the_three_dots_next_to_the_pool_and_select_lock(driver):
    """click on the three dots next to the pool and select Lock."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__encryptedpool"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__encryptedpool"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__encryptedpool_Lock"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__encryptedpool_Lock"]').click()


@then('don\'t check Force unmount, check the Confirm box and then Lock')
def dont_check_force_unmount_check_the_confirm_box_and_then_lock(driver):
    """don't check Force unmount, check the Confirm box and then Lock."""
    assert wait_on_element(driver, 5, '//h1[contains(.,"Lock Dataset encrypted")]')
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__FORCE UNMOUNT "]', 'clickable')
    assert not attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__FORCE UNMOUNT "]', 'class', 'mat-checkbox-checked')
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__LOCK"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__LOCK"]').click()
    assert wait_on_element_disappear(driver, 15, '//h1[contains(.,"Locking Dataset")]')
    time.sleep(1)


@then('verify the pool is locked')
def verify_the_pool_is_locked(driver):
    """verify the pool is locked."""
    assert wait_on_element(driver, 7, '//mat-icon[@fonticon="mdi-lock"]')


@then('click on the three dots next to the pool and select Unlock')
def click_on_the_three_dots_next_to_the_pool_and_select_unlock(driver):
    """click on the three dots next to the pool and select Unlock."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__encryptedpool"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__encryptedpool"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__encryptedpool_Unlock"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__encryptedpool_Unlock"]').click()


@then('input in the Dataset Passphrase and click the Submit button')
def input_in_the_dataset_passphrase_and_click_the_submit_button(driver):
    """input in the Dataset Passphrase and click the Submit button."""
    assert wait_on_element(driver, 7, '//input[@placeholder="Dataset Passphrase"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Dataset Passphrase"]').send_keys('abcd1234')
    assert wait_on_element(driver, 5, xpaths.button.summit, 'clickable')
    rsc.click_The_Summit_Button(driver)
    assert wait_on_element(driver, 10, '//h1[contains(.,"Unlock Datasets")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Unlock Datasets")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    time.sleep(1)


@then('verify the pool is unlocked')
def verify_the_pool_is_unlocked(driver):
    """verify the pool is unlocked."""
    assert wait_on_element(driver, 7, '//mat-icon[@fonticon="mdi-lock-open-variant"]')
