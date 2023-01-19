# coding=utf-8
"""SCALE UI: feature tests."""

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
        assert wait_on_element(driver, 10, xpaths.login.user_input)
    if not is_element_present(driver, xpaths.sideMenu.dashboard):
        assert wait_on_element(driver, 10, xpaths.login.user_input)
        driver.find_element_by_xpath(xpaths.login.user_input).clear()
        driver.find_element_by_xpath(xpaths.login.user_input).send_keys('root')
        driver.find_element_by_xpath(xpaths.login.password_Input).clear()
        driver.find_element_by_xpath(xpaths.login.password_Input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('on the dashboard, click Datasets on the side menu')
def on_the_dashboard_click_datasets_on_the_side_menu(driver):
    """on the dashboard, click Datasets on the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.dashboard.system_Info_Card_Title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.datasets, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.datasets).click()


@then('on the Datasets page click on encrypted_pool')
def on_the_datasets_page_click_on_encrypted_pool(driver):
    """on the Datasets page click on encrypted_pool."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_tree_name('encrypted_pool'))
    driver.find_element_by_xpath(xpaths.dataset.pool_tree('encrypted_pool')).click()
    assert wait_on_element(driver, 7, xpaths.dataset.pool_selected('encrypted_pool'))


@then('on the ZFS Encryption card click Edit')
def on_the_zfs_encryption_card_click_edit(driver):
    """on the ZFS Encryption card click Edit."""
    assert wait_on_element(driver, 5, xpaths.dataset.zfsEncryption_title)
    assert wait_on_element(driver, 4, xpaths.dataset.zfsEncryption_edit_button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.zfsEncryption_edit_button).click()


@then('on the Edit Encryption Options box set Encryption Type to passphrase')
def on__the_edit_encryption_options_box_set_encryption_type_to_passphrase(driver):
    """on the Edit Encryption Options box set Encryption Type to passphrase."""
    assert wait_on_element(driver, 10, xpaths.editEncryption.title)
    assert wait_on_element(driver, 5, xpaths.editEncryption.encryptionType_checkbox)
    driver.find_element_by_xpath(xpaths.editEncryption.encryptionType_checkbox).click()
    assert wait_on_element(driver, 5, xpaths.editEncryption.encryptionType_passphrase_option, 'clickable')
    driver.find_element_by_xpath(xpaths.editEncryption.encryptionType_passphrase_option).click()


@then(parsers.parse('enter "{passphrase}" for Passphrase and "{confirm_passphrase}" for Confirm Passphrase'))
def enter_passphrase_and_confirm_passphrase(driver, passphrase, confirm_passphrase):
    """enter "{passphrase}" for Passphrase and "{confirm_passphrase}" for Confirm Passphrase."""
    assert wait_on_element(driver, 5, xpaths.editEncryption.passphrase_input, 'inputable')
    driver.find_element_by_xpath(xpaths.editEncryption.passphrase_input).clear()
    driver.find_element_by_xpath(xpaths.editEncryption.passphrase_input).send_keys(passphrase)
    assert wait_on_element(driver, 5, xpaths.editEncryption.confirmPassphrase_input, 'inputable')
    driver.find_element_by_xpath(xpaths.editEncryption.confirmPassphrase_input).clear()
    driver.find_element_by_xpath(xpaths.editEncryption.confirmPassphrase_input).send_keys(confirm_passphrase)


@then(parsers.parse('verify that "{error_message}" error shows'))
def verify_that_passphrase_and_confirmation_should_match_error_shows(driver, error_message):
    """verify that "Passphrase and confirmation should match" error shows."""
    assert wait_on_element(driver, 10, xpaths.error.message_text(error_message))


@then(parsers.parse('enter "{passphrase}" for both Passphrase and Confirm Passphrase'))
def enter_passphrase_for_both_passphrase_and_confirm_passphrase(driver, passphrase):
    """enter "{passphrase}" for both Passphrase and Confirm Passphrase."""
    assert wait_on_element(driver, 5, xpaths.editEncryption.confirmPassphrase_input, 'inputable')
    driver.find_element_by_xpath(xpaths.editEncryption.confirmPassphrase_input).clear()
    driver.find_element_by_xpath(xpaths.editEncryption.confirmPassphrase_input).send_keys(passphrase)
    assert wait_on_element_disappear(driver, 10, '//mat-error[contains(.,"The passwords do not match.")]')


@then('click the confirm checkbox and click the Save button')
def click_the_confirm_checkbox_and_click_the_save_button(driver):
    """click the confirm checkbox and click the Save button."""
    assert wait_on_element(driver, 10, xpaths.editEncryption.confirm_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.editEncryption.confirm_checkbox).click()
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element_disappear(driver, 20, xpaths.popup.pleaseWait)
    assert wait_on_element_disappear(driver, 20, xpaths.progress.progressbar)


@then('once save and back on Datasets page lock the pool')
def once_save_and_back_on_dataset_lock_the_pool(driver):
    """once save and back on Dataset lock the pool."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_tree_name('encrypted_pool'))
    driver.find_element_by_xpath(xpaths.dataset.pool_tree('encrypted_pool')).click()
    assert wait_on_element(driver, 7, xpaths.dataset.pool_selected('encrypted_pool'))
    assert wait_on_element(driver, 4, xpaths.dataset.lock_button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.lock_button).click()
    assert wait_on_element(driver, 10, xpaths.lockDataset.title)

    assert wait_on_element(driver, 10, xpaths.lockDataset.forceUnmount_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.lockDataset.forceUnmount_checkbox).click()
    assert wait_on_element(driver, 5, xpaths.lockDataset.lock_button, 'clickable')
    driver.find_element_by_xpath(xpaths.lockDataset.lock_button).click()

    assert wait_on_element(driver, 10, xpaths.dataset.title)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_tree_name('encrypted_pool'))
    assert wait_on_element(driver, 5, xpaths.dataset.lockPool_icon)


@then(parsers.parse('unlock the pool with "{passphrase}"'))
def unlock_the_pool_with_passphrase(driver, passphrase):
    """unlock the pool with "{passphrase}"."""
    driver.find_element_by_xpath(xpaths.dataset.pool_tree('encrypted_pool')).click()
    assert wait_on_element(driver, 7, xpaths.dataset.pool_selected('encrypted_pool'))
    assert wait_on_element(driver, 4, xpaths.dataset.unlock_button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.unlock_button).click()
    assert wait_on_element(driver, 10, xpaths.unlockDataset.title)
    assert wait_on_element(driver, 5, xpaths.unlockDataset.datasetPassphrase_input, 'inputable')
    driver.find_element_by_xpath(xpaths.unlockDataset.datasetPassphrase_input).clear()
    driver.find_element_by_xpath(xpaths.unlockDataset.datasetPassphrase_input).send_keys(passphrase)
    assert wait_on_element(driver, 10, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()

    assert wait_on_element(driver, 10, xpaths.unlockDataset.unlockDatasets_message1)
    assert wait_on_element(driver, 10, xpaths.button.CONTINUE, 'clickable')
    driver.find_element_by_xpath(xpaths.button.CONTINUE).click()

    assert wait_on_element(driver, 10, xpaths.unlockDataset.unlockDatasets_message2)
    assert wait_on_element(driver, 10, xpaths.button.CLOSE, 'clickable')
    driver.find_element_by_xpath(xpaths.button.CLOSE).click()

    assert wait_on_element(driver, 20, xpaths.dataset.unlockPool_icon)
