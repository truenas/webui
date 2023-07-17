# coding=utf-8
"""SCALE UI: feature tests."""

import reusableSeleniumCode as rsc
import xpaths
from function import (
    wait_on_element,
    is_element_present,
    wait_on_element_disappear,
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
    parsers
)
from pytest_dependency import depends


@scenario('features/NAS-T1243.feature', 'Verify that changing an encryption key format to PASSPHRASE functions')
def test_verify_that_changing_an_encryption_key_format_to_passphrase_functions():
    """SCALE UI: Verify that changing an encryption key format to PASSPHRASE functions."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password, request):
    """the browser is open, the TrueNAS URL and logged in."""
    depends(request, ['encrypted_pool'], scope='session')
    if nas_ip not in driver.current_url:
        driver.get(f"http://{nas_ip}")
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
    if not is_element_present(driver, xpaths.side_Menu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_Input)
        driver.find_element_by_xpath(xpaths.login.user_Input).clear()
        driver.find_element_by_xpath(xpaths.login.user_Input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_Button)
        driver.find_element_by_xpath(xpaths.login.signin_Button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.side_Menu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.side_Menu.dashboard).click()


@when('on the dashboard, click Datasets on the side menu')
def on_the_dashboard_click_datasets_on_the_side_menu(driver):
    """on the dashboard, click Datasets on the side menu."""
    rsc.Verify_The_Dashboard(driver)
    assert wait_on_element(driver, 10, xpaths.side_Menu.datasets, 'clickable')
    driver.find_element_by_xpath(xpaths.side_Menu.datasets).click()


@then('on the Datasets page click on encrypted_pool')
def on_the_datasets_page_click_on_encrypted_pool(driver):
    """on the Datasets page click on encrypted_pool."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Tree_Name('encrypted_pool'))
    driver.find_element_by_xpath(xpaths.dataset.pool_Tree('encrypted_pool')).click()
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Selected('encrypted_pool'))


@then('on the ZFS Encryption card click Edit')
def on_the_zfs_encryption_card_click_edit(driver):
    """on the ZFS Encryption card click Edit."""
    assert wait_on_element(driver, 5, xpaths.dataset.zfs_Encryption_Title)
    assert wait_on_element(driver, 4, xpaths.dataset.zfs_Encryption_Edit_button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.zfs_Encryption_Edit_button).click()


@then('on the Edit Encryption Options box set Encryption Type to passphrase')
def on__the_edit_encryption_options_box_set_encryption_type_to_passphrase(driver):
    """on the Edit Encryption Options box set Encryption Type to passphrase."""
    assert wait_on_element(driver, 10, xpaths.edit_Encryption.title)
    assert wait_on_element_disappear(driver, 10, xpaths.popup.please_Wait)
    assert wait_on_element(driver, 5, xpaths.edit_Encryption.encryption_Type_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Encryption.encryption_Type_Checkbox).click()
    assert wait_on_element(driver, 5, xpaths.edit_Encryption.encryption_Type_Passphrase_Option, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Encryption.encryption_Type_Passphrase_Option).click()


@then(parsers.parse('enter "{passphrase}" for Passphrase and "{confirm_passphrase}" for Confirm Passphrase'))
def enter_passphrase_and_confirm_passphrase(driver, passphrase, confirm_passphrase):
    """enter "{passphrase}" for Passphrase and "{confirm_passphrase}" for Confirm Passphrase."""
    assert wait_on_element(driver, 5, xpaths.edit_Encryption.passphrase_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.edit_Encryption.passphrase_Input).clear()
    driver.find_element_by_xpath(xpaths.edit_Encryption.passphrase_Input).send_keys(passphrase)
    assert wait_on_element(driver, 5, xpaths.edit_Encryption.confirm_Passphrase_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.edit_Encryption.confirm_Passphrase_Input).clear()
    driver.find_element_by_xpath(xpaths.edit_Encryption.confirm_Passphrase_Input).send_keys(confirm_passphrase)


@then(parsers.parse('verify that "{error_message}" error shows'))
def verify_that_passphrase_and_confirmation_should_match_error_shows(driver, error_message):
    """verify that "Passphrase and confirmation should match" error shows."""
    assert wait_on_element(driver, 10, xpaths.error.message_Text(error_message))


@then(parsers.parse('enter "{passphrase}" for both Passphrase and Confirm Passphrase'))
def enter_passphrase_for_both_passphrase_and_confirm_passphrase(driver, passphrase):
    """enter "{passphrase}" for both Passphrase and Confirm Passphrase."""
    assert wait_on_element(driver, 5, xpaths.edit_Encryption.confirm_Passphrase_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.edit_Encryption.confirm_Passphrase_Input).clear()
    driver.find_element_by_xpath(xpaths.edit_Encryption.confirm_Passphrase_Input).send_keys(passphrase)
    assert wait_on_element_disappear(driver, 10, '//mat-error[contains(.,"The passwords do not match.")]')


@then('click the confirm checkbox and click the Save button')
def click_the_confirm_checkbox_and_click_the_save_button(driver):
    """click the confirm checkbox and click the Save button."""
    assert wait_on_element(driver, 10, xpaths.edit_Encryption.confirm_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.edit_Encryption.confirm_Checkbox).click()
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)


@then('once save and back on Datasets page lock the pool')
def once_save_and_back_on_dataset_lock_the_pool(driver):
    """once save and back on Dataset lock the pool."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Tree_Name('encrypted_pool'))
    driver.find_element_by_xpath(xpaths.dataset.pool_Tree('encrypted_pool')).click()
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Selected('encrypted_pool'))
    assert wait_on_element(driver, 4, xpaths.dataset.lock_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.lock_Button).click()
    assert wait_on_element(driver, 10, xpaths.lock_Dataset.title)

    assert wait_on_element(driver, 10, xpaths.lock_Dataset.force_Unmount_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.lock_Dataset.force_Unmount_Checkbox).click()
    assert wait_on_element(driver, 5, xpaths.lock_Dataset.lock_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.lock_Dataset.lock_Button).click()

    assert wait_on_element(driver, 10, xpaths.dataset.title)
    assert wait_on_element(driver, 10, xpaths.dataset.pool_Tree_Name('encrypted_pool'))
    assert wait_on_element(driver, 15, xpaths.dataset.lock_Pool_Icon)


@then(parsers.parse('unlock the pool with "{passphrase}"'))
def unlock_the_pool_with_passphrase(driver, passphrase):
    """unlock the pool with "{passphrase}"."""
    driver.find_element_by_xpath(xpaths.dataset.pool_Tree('encrypted_pool')).click()
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Selected('encrypted_pool'))
    assert wait_on_element(driver, 4, xpaths.dataset.unlock_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.unlock_Button).click()
    assert wait_on_element(driver, 10, xpaths.unlock_Dataset.title)
    assert wait_on_element(driver, 5, xpaths.unlock_Dataset.dataset_Passphrase_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.unlock_Dataset.dataset_Passphrase_Input).clear()
    driver.find_element_by_xpath(xpaths.unlock_Dataset.dataset_Passphrase_Input).send_keys(passphrase)
    assert wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()

    assert wait_on_element(driver, 10, xpaths.unlock_Dataset.unlock_Datasets_Message1)
    assert wait_on_element(driver, 10, xpaths.button.CONTINUE, 'clickable')
    driver.find_element_by_xpath(xpaths.button.CONTINUE).click()

    assert wait_on_element(driver, 10, xpaths.unlock_Dataset.unlock_Datasets_Message2)
    assert wait_on_element(driver, 10, xpaths.button.CLOSE, 'clickable')
    driver.find_element_by_xpath(xpaths.button.CLOSE).click()

    assert wait_on_element(driver, 20, xpaths.dataset.unlock_Pool_Icon)
