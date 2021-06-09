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
)


@scenario('features/NAS-T1080.feature', 'Verify that a pool can be encrypted, locked and unlocked with a passphrase')
def test_verify_that_a_pool_can_be_encrypted_locked_and_unlocked_with_a_passphrase(driver):
    """Verify that a pool can be encrypted, locked and unlocked with a passphrase."""


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


@then('on the Pool Manager, enter encrypted for pool name')
def on_the_pool_manager_enter_encrypted_for_pool_name(driver):
    """on the Pool Manager, enter encrypted for pool name."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pool Manager")]')
    assert wait_on_element(driver, 5, '//input[@placeholder="Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Name"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="Name"]').send_keys('encrypted')


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
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
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
    assert wait_on_element_disappear(driver, 15, '//button[@ix-auto="button__DOWNLOAD ENCRYPTION KEY"]', 'clickable')


@then('the new encrypted should appear in the pools list')
def the_new_encrypted_should_appear_in_the_pools_list(driver):
    """the new encrypted should appear in the pools list."""
    assert wait_on_element(driver, 10, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 5, '//mat-panel-title[contains(.,"encrypted)]')


@then('click on the three dots button for the encrypted pool, select Encryption Options')
def click_on_the_three_dots_button_for_the_encrypted_pool_select_encryption_options(driver):
    """click on the three dots button for the encrypted pool, select Encryption Options."""


@then('switch the encryption type from Key to Passphrase, enter your passphrase')
def switch_the_encryption_type_from_key_to_passphrase_enter_your_passphrase(driver):
    """switch the encryption type from Key to Passphrase, enter your passphrase."""


@then('leave the pbkdf2iters at 35000, and click the Save button')
def leave_the_pbkdf2iters_at_35000_and_click_the_save_button(driver):
    """leave the pbkdf2iters at 35000, and click the Save button."""


@then('click on the three dots button for the encrypted pool, select Add Dataset')
def click_on_the_three_dots_button_for_the_encrypted_pool_select_add_dataset(driver):
    """click on the three dots button for the encrypted pool, select Add Dataset."""


@then('input a name leaving the Inherit (encrypted) option checked')
def input_a_name_leaving_the_inherit_encrypted_option_checked(driver):
    """input a name leaving the Inherit (encrypted) option checked."""


@then('click the SUBMIT button, the dataset should be created')
def click_the_submit_button_the_dataset_should_be_created(driver):
    """click the SUBMIT button, the dataset should be created."""


@then('click on the three dots next to the pool and select Lock')
def click_on_the_three_dots_next_to_the_pool_and_select_lock(driver):
    """click on the three dots next to the pool and select Lock."""


@then('don\'t check Force unmount, check the Confirm box and then Lock')
def dont_check_force_unmount_check_the_confirm_box_and_then_lock(driver):
    """don't check Force unmount, check the Confirm box and then Lock."""


@then('verify the pool is locked')
def verify_the_pool_is_locked(driver):
    """verify the pool is locked."""


@then('click on the three dots next to the pool and select Unlock')
def click_on_the_three_dots_next_to_the_pool_and_select_unlock(driver):
    """click on the three dots next to the pool and select Unlock."""


@then('input in the Dataset Passphrase and click the Submit button')
def input_in_the_dataset_passphrase_and_click_the_submit_button(driver):
    """input in the Dataset Passphrase and click the Submit button."""


@then('verify the pool is unlocked')
def verify_the_pool_is_unlocked(driver):
    """verify the pool is unlocked."""


@then('click the power button and click Restart to reboot TrueNAS')
def click_the_power_button_and_click_restart_to_reboot_truenas(driver):
    """click the power button and click Restart to reboot TrueNAS."""


@then('wait for the login UI to comeback then login')
def wait_for_the_login_ui_to_comeback_then_login(driver):
    """wait for the login UI to comeback then login."""


@then('confirm the pool is locked after the reboot')
def confirm_the_pool_is_locked_after_the_reboot(driver):
    """confirm the pool is locked after the reboot."""
