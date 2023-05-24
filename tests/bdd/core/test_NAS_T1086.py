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
    wait_for_attribute_value
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
import pytest
pytestmark = [pytest.mark.debug_test]


@scenario('features/NAS-T1086.feature', 'Verify the ZFS Encryption Options function')
def test_verify_the_zfs_encryption_options_function(driver):
    """Verify the ZFS Encryption Options function."""
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
        assert wait_on_element(driver, 10, '//span[contains(.,"root")]')
        element = driver.find_element_by_xpath('//span[contains(.,"root")]')
        driver.execute_script("arguments[0].scrollIntoView();", element)
        time.sleep(0.5)
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


@then('on the Pools page, click on the three dots button of the encrypted pool')
def on_the_pools_page_click_on_the_three_dots_button_of_the_encrypted_pool(driver):
    """on the Pools page, click on the three dots button of the encrypted pool."""
    assert wait_on_element(driver, 5, '//div[contains(.,"Pools")]')
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__encryptedpool"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__encryptedpool"]').click()


@then('select Add Dataset, input a name leaving the Inherit (encrypted) option checked')
def select_add_dataset_input_a_name_leaving_the_inherit_encrypted_option_checked(driver):
    """select Add Dataset, input a name leaving the Inherit (encrypted) option checked."""
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__encryptedpool_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__encryptedpool_Add Dataset"]').click()
    assert wait_on_element(driver, 7, '//h4[contains(.,"Name and Options")]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('encrypted1')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Inherit (encrypted)"]', 'clickable')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Inherit (encrypted)"]', 'class', 'mat-checkbox-checked')


@then('click the SUBMIT button, the inherit encrypted dataset should be created')
def click_the_submit_button_the_inherit_encrypted_dataset_should_be_created(driver):
    """click the SUBMIT button, the inherit encrypted dataset should be created."""
    rsc.click_The_Summit_Button(driver)
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"encrypted1")]')


@then('click on the three dots button of the encrypted pool, select Add Dataset')
def click_on_the_three_dots_button_of_the_encrypted_pool_select_add_dataset(driver):
    """click on the three dots button of the encrypted pool, select Add Dataset."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__encryptedpool"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__encryptedpool"]').click()
    assert wait_on_element(driver, 7, '//button[@ix-auto="action__encryptedpool_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__encryptedpool_Add Dataset"]').click()


@then('input a name uncheck the Inherit (encrypted) checkbox')
def input_a_name_uncheck_the_inherit_encrypted_checkbox(driver):
    """input a name uncheck the Inherit (encrypted) checkbox."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Name and Options")]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('encrypted2')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Inherit (encrypted)"]', 'class', 'mat-checkbox-checked')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Inherit (encrypted)"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Inherit (encrypted)"]').click()


@then('set new encryption properties/password')
def set_new_encryption_propertiespassword(driver):
    """set new encryption properties/password."""
    assert wait_on_element(driver, 10, '//input[@placeholder="Passphrase"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Passphrase"]').send_keys('Abcd1234!')
    driver.find_element_by_xpath('//input[@placeholder="Confirm Passphrase"]').send_keys('Abcd1234!')
    driver.find_element_by_xpath('//input[@placeholder="pbkdf2iters"]').clear()
    driver.find_element_by_xpath('//input[@placeholder="pbkdf2iters"]').send_keys('300000')


@then('click the SUBMIT button, the dataset should be created')
def click_the_submit_button_the_dataset_should_be_created(driver):
    """click the SUBMIT button, the dataset should be created."""
    rsc.click_The_Summit_Button(driver)
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"encrypted2")]')


@then('lock the root dataset and the child dataset')
def lock_the_root_dataset_and_the_child_dataset(driver):
    """lock the root dataset and the child dataset."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__encryptedpool"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__encryptedpool"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__encryptedpool_Lock"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__encryptedpool_Lock"]').click()
    assert wait_on_element(driver, 5, '//h1[contains(.,"Lock Dataset encryptedpool")]')
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__FORCE UNMOUNT "]', 'clickable')
    assert not attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__FORCE UNMOUNT "]', 'class', 'mat-checkbox-checked')
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__LOCK"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__LOCK"]').click()
    assert wait_on_element_disappear(driver, 15, '//h1[contains(.,"Locking Dataset")]')


@then('verify all dataset are looked')
def verify_all_dataset_are_looked(driver):
    """Verify all dataset are looked."""
    assert wait_on_element(driver, 5, '//td[@id="tbody__name_encryptedpool"]/span/span/mat-icon')
    wait_for_attribute_value(driver, 5, '//td[@id="tbody__name_encryptedpool"]/span/span/mat-icon', 'fonticon', 'mdi-lock')
    assert wait_on_element(driver, 5, '//td[@id="tbody__name_encrypted2"]/span/span/mat-icon')
    assert attribute_value_exist(driver, '//td[@id="tbody__name_encrypted2"]/span/span/mat-icon', 'fonticon', 'mdi-lock')


@then('unlock the root dataset, enable "Unlock child datasets"')
def unlock_the_root_dataset_enable_unlock_child_datasets(driver):
    """unlock the root dataset, enable "Unlock child datasets"."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__encryptedpool"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__encryptedpool"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__encryptedpool_Unlock"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__encryptedpool_Unlock"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"Unlock Datasets")]')
    assert wait_on_element(driver, 5, '(//input[@placeholder="Dataset Passphrase"])[1]', 'inputable')
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Unlock Children"]', 'clickable')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Unlock Children"]', 'class', 'mat-checkbox-checked')
    driver.find_element_by_xpath('(//input[@placeholder="Dataset Passphrase"])[1]').send_keys('abcd1234')
    driver.find_element_by_xpath('(//input[@placeholder="Dataset Passphrase"])[2]').send_keys('Abcd1234!')
    rsc.click_The_Summit_Button(driver)
    assert wait_on_element(driver, 10, '//h1[contains(.,"Unlock Datasets")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Unlock Datasets")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()


@then('verify that it unlocked the child datasets')
def verify_that_it_unlocked_the_child_datasets(driver):
    """verify that it unlocked the child datasets."""
    assert wait_on_element(driver, 5, '//td[@id="tbody__name_encryptedpool"]/span/span/mat-icon')
    assert wait_for_attribute_value(driver, 5, '//td[@id="tbody__name_encryptedpool"]/span/span/mat-icon', 'fonticon', 'mdi-lock-open-variant')
    assert wait_on_element(driver, 5, '//td[@id="tbody__name_encrypted2"]/span/span/mat-icon')
    assert attribute_value_exist(driver, '//td[@id="tbody__name_encrypted2"]/span/span/mat-icon', 'fonticon', 'mdi-lock-open-variant')


@then('unlock the root dataset, disable "Unlock child datasets"')
def unlock_the_root_dataset_disable_unlock_child_datasets(driver):
    """unlock the root dataset, disable "Unlock child datasets"."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__encryptedpool"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__encryptedpool"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__encryptedpool_Unlock"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__encryptedpool_Unlock"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"Unlock Datasets")]')
    assert wait_on_element(driver, 5, '//input[@placeholder="Dataset Passphrase"]', 'inputable')
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Unlock Children"]', 'clickable')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Unlock Children"]', 'class', 'mat-checkbox-checked')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Unlock Children"]').click()
    driver.find_element_by_xpath('//input[@placeholder="Dataset Passphrase"]').send_keys('abcd1234')
    rsc.click_The_Summit_Button(driver)
    assert wait_on_element(driver, 10, '//h1[contains(.,"Unlock Datasets")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Unlock Datasets")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()


@then('verify that it did not unlock children')
def confirm_that_it_did_not_unlock_children(driver):
    """confirm that it did not unlock children."""
    assert wait_on_element(driver, 5, '//td[@id="tbody__name_encryptedpool"]/span/span/mat-icon')
    assert wait_for_attribute_value(driver, 5, '//td[@id="tbody__name_encryptedpool"]/span/span/mat-icon', 'fonticon', 'mdi-lock-open-variant')
    assert wait_on_element(driver, 5, '//td[@id="tbody__name_encrypted2"]/span/span/mat-icon')
    assert attribute_value_exist(driver, '//td[@id="tbody__name_encrypted2"]/span/span/mat-icon', 'fonticon', 'mdi-lock')


@then('click on the three dots button of a non-encrypted pool, select Add Dataset')
def click_on_the_three_dots_button_of_a_nonencrypted_pool_select_add_dataset(driver):
    """click on the three dots button of a non-encrypted pool, select Add Dataset."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__system"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__system"]').click()
    assert wait_on_element(driver, 7, '//div[@class="title" and contains(.,"Dataset Actions")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__system_Create Snapshot"]', 'clickable')
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__system_Add Dataset"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__system_Add Dataset"]').click()


@then('input a name uncheck the Inherit (non-encrypted) checkbox')
def input_a_name_uncheck_the_inherit_non_encrypted_checkbox(driver):
    """input a name uncheck the Inherit (encrypted) checkbox."""
    assert wait_on_element(driver, 7, '//h4[contains(.,"Name and Options")]')
    assert wait_on_element(driver, 7, '//input[@ix-auto="input__Name"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Name"]').send_keys('encrypted3')
    assert wait_on_element(driver, 7, '//mat-checkbox[@ix-auto="checkbox__Inherit (non-encrypted)"]', 'clickable')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Inherit (non-encrypted)"]', 'class', 'mat-checkbox-checked')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Inherit (non-encrypted)"]').click()


@then('set paraphrase encryption with a password')
def set_paraphrase_encryption_with_a_password(driver):
    """set paraphrase encryption with a password."""
    assert wait_on_element(driver, 5, '//mat-select[@ix-auto="select__Encryption Type"]', 'clickable')
    driver.find_element_by_xpath('//mat-select[@ix-auto="select__Encryption Type"]').click()
    assert wait_on_element(driver, 5, '//mat-option[@ix-auto="option__Encryption Type_Passphrase"]', 'clickable')
    driver.find_element_by_xpath('//mat-option[@ix-auto="option__Encryption Type_Passphrase"]').click()
    assert wait_on_element(driver, 10, '//input[@placeholder="Passphrase"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Passphrase"]').send_keys('abcd1234!')
    driver.find_element_by_xpath('//input[@placeholder="Confirm Passphrase"]').send_keys('abcd1234!')


@then('click the SUBMIT button, the new dataset should be created')
def click_the_submit_button_the_new_dataset_should_be_created(driver):
    """click the SUBMIT button, the new dataset should be created."""
    rsc.click_The_Summit_Button(driver)
    assert wait_on_element_disappear(driver, 20, '//h6[contains(.,"Please wait")]')
    assert wait_on_element(driver, 10, '//span[contains(.,"encrypted3")]')


@then('lock the child dataset')
def lock_the_child_dataset(driver):
    """lock the child dataset."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__encrypted3"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__encrypted3"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__encrypted3_Lock"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__encrypted3_Lock"]').click()
    assert wait_on_element(driver, 5, '//h1[contains(.,"Lock Dataset encrypted3")]')
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__FORCE UNMOUNT "]', 'clickable')
    assert not attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__FORCE UNMOUNT "]', 'class', 'mat-checkbox-checked')
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__CONFIRM"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__CONFIRM"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__LOCK"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__LOCK"]').click()
    assert wait_on_element_disappear(driver, 15, '//h1[contains(.,"Locking Dataset")]')


@then('verify the child dataset is looked')
def verify_the_child_dataset_is_looked(driver):
    """Verify the child dataset is looked."""
    assert wait_on_element(driver, 5, '//td[@id="tbody__name_encrypted3"]/span/span/mat-icon')
    assert wait_for_attribute_value(driver, 5, '//td[@id="tbody__name_encrypted3"]/span/span/mat-icon', 'fonticon', 'mdi-lock')


@then('unlock the child dataset')
def unlock_the_child_dataset(driver):
    """unlock the child dataset."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__encrypted3"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__encrypted3"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__encrypted3_Unlock"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__encrypted3_Unlock"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"Unlock Datasets")]')
    assert wait_on_element(driver, 5, '//input[@placeholder="Dataset Passphrase"]', 'inputable')
    driver.find_element_by_xpath('//input[@placeholder="Dataset Passphrase"]').send_keys('abcd1234!')
    rsc.click_The_Summit_Button(driver)
    assert wait_on_element(driver, 10, '//h1[contains(.,"Unlock Datasets")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Unlock Datasets")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()


@then('verify that the child datasets is unlocked')
def verify_that_the_child_datasets_is_unlocked(driver):
    """verify that the child datasets is unlocked."""
    assert wait_on_element(driver, 5, '//td[@id="tbody__name_encrypted3"]/span/span/mat-icon')
    wait_for_attribute_value(driver, 5, '//td[@id="tbody__name_encrypted3"]/span/span/mat-icon', 'fonticon', 'mdi-lock-open-variant')
