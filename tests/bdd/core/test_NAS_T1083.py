# coding=utf-8
"""Core UI feature tests."""

import time
import reusableSeleniumCode as rsc
import xpaths
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
)


@scenario('features/NAS-T1083.feature', 'Verify encrypted dataset and pool can be delete')
def test_verify_encrypted_dataset_and_pool_can_be_delete(driver):
    """Verify encrypted dataset and pool can be delete."""
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


@then('on the Pools page, click on the encrypted dataset three dots button')
def on_the_pools_page_click_on_the_encrypted_dataset_three_dots_button(driver):
    """on the Pools page, click on the encrypted dataset three dots button."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 7, '//mat-icon[@id="actions_menu_button__encrypteddataset"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__encrypteddataset"]').click()


@then('select Delete DATASET, on Delete Dataset, input the dataset name')
def select_delete_dataset_on_delete_dataset_input_the_dataset_name(driver):
    """select Delete DATASET, on Delete Dataset, input the dataset name."""
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__encrypteddataset_Delete Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__encrypteddataset_Delete Dataset"]').click()
    assert wait_on_element(driver, 5, '//h1[contains(.,"Delete Dataset")]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__"]').send_keys('encrypteddataset')


@then('click the confirm checkbox and click DELETE DATASET')
def click_the_confirm_checkbox_and_click_delete_dataset(driver):
    """click the confirm checkbox and click DELETE DATASET."""
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Confirm"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Confirm"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__DELETE DATASET"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__DELETE DATASET"]').click()


@then('verify that the encrypted dataset is removed')
def verify_that_the_dataset_is_removed(driver):
    """verify that the dataset is removed."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element_disappear(driver, 20, '//td[@id="tbody__name_encrypteddataset"]')


@then('click on the gear of an encrypted pool, then click Export/Disconnect')
def click_on_the_gear_of_an_encrypted_pool_then_click_exportdisconnect(driver):
    """click on the gear of an encrypted pool, then click Export/Disconnect."""
    assert wait_on_element(driver, 7, '//mat-icon[@id="encrypted_settings_button"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="encrypted_settings_button"]').click()
    assert wait_on_element(driver, 5, '//button[@id="action_button_Export/Disconnect__encrypted"]', 'clickable')
    driver.find_element_by_xpath('//button[@id="action_button_Export/Disconnect__encrypted"]').click()


@then('on the Export/disconnect pool, click on Destroy data on this pool')
def on_the_exportdisconnect_pool_click_on_destroy_data_on_this_pool(driver):
    """on the Export/disconnect pool, click on Destroy data on this pool."""
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Destroy data on this pool?"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Destroy data on this pool?"]').click()


@then('input the pool name under "Enter pool name below to confirm"')
def input_the_pool_name_under_enter_pool_name_below_to_confirm(driver):
    """input the pool name under "Enter pool name below to confirm"."""
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__"]').send_keys('encrypted')


@then('click the confirm checkbox, then click the EXPORT/DISCONNECT button')
def click_the_confirm_checkbox_then_click_the_exportdisconnect_button(driver):
    """click the confirm checkbox, then click the EXPORT/DISCONNECT button."""
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Confirm Export/Disconnect"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Confirm Export/Disconnect"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__EXPORT/DISCONNECT"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__EXPORT/DISCONNECT"]').click()


@then('verify that the encrypted pool is removed')
def verify_that_the_encrypted_pool_is_removed(driver):
    """verify that the encrypted pool is removed."""
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 15, '//textarea[contains(.,"Successfully exported/disconnected \'encrypted\'")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element_disappear(driver, 20, '//td[@id="tbody__name_encrypted"]')
