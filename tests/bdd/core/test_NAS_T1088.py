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


@scenario('features/NAS-T1088.feature', 'Verify an exception is raised when entering the wrong passphrase for an encrypted pool')
def test_verify_an_exception_is_raised_when_entering_the_wrong_passphrase_for_an_encrypted_pool(driver):
    """Verify an exception is raised when entering the wrong passphrase for an encrypted pool."""


@given('the browser is open, the TrueNAS URL and logged in')
def the_browser_is_open_the_truenas_url_and_logged_in(driver, nas_ip, root_password):
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


@then('lock an encrypted root dataset and the child dataset')
def lock_an_encrypted_root_dataset_and_the_child_dataset(driver):
    """lock an encrypted root dataset and the child dataset."""
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


@then('verify the root dataset is locked')
def verify_the_root_dataset_is_locked(driver):
    """verify the root dataset is locked."""
    assert wait_on_element(driver, 5, '//td[@id="tbody__name_encryptedpool"]/span/span/mat-icon')
    wait_for_attribute_value(driver, 5, '//td[@id="tbody__name_encryptedpool"]/span/span/mat-icon', 'fonticon', 'mdi-lock')


@then('try to unlock the root dataset with an invalid passphrase')
def try_to_unlock_the_root_dataset_with_an_invalid_passphrase(driver):
    """try to unlock the root dataset with an invalid passphrase."""
    assert wait_on_element(driver, 5, '//mat-icon[@id="actions_menu_button__encryptedpool"]', 'clickable')
    driver.find_element_by_xpath('//mat-icon[@id="actions_menu_button__encryptedpool"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="action__encryptedpool_Unlock"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="action__encryptedpool_Unlock"]').click()
    assert wait_on_element(driver, 5, '//h4[contains(.,"Unlock Datasets")]')
    assert wait_on_element(driver, 5, '//input[@placeholder="Dataset Passphrase"]', 'inputable')
    assert wait_on_element(driver, 5, '//mat-checkbox[@ix-auto="checkbox__Unlock Children"]', 'clickable')
    assert attribute_value_exist(driver, '//mat-checkbox[@ix-auto="checkbox__Unlock Children"]', 'class', 'mat-checkbox-checked')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__Unlock Children"]').click()
    driver.find_element_by_xpath('//input[@placeholder="Dataset Passphrase"]').send_keys('aabcd1234')
    assert wait_on_element(driver, 5, xpaths.button.summit, 'clickable')
    rsc.click_The_Summit_Button(driver)
    assert wait_on_element_disappear(driver, 30, '//h6[contains(.,"Please wait")]')


@then('an exception about pool unlock failure should be raised')
def an_exception_about_pool_unlock_failure_should_be_raised(driver):
    """an exception about pool unlock failure should be raised."""
    assert wait_on_element(driver, 5, '//h1[contains(.,"Unlock Datasets")]')
    time.sleep(1)
    assert wait_on_element(driver, 5, '//p[contains(.,"The following datasets cannot be unlocked")]')
    assert wait_on_element(driver, 5, '(//strong[contains(.,"encryptedpool")])[1]/../a/u')
    driver.find_element_by_xpath('(//strong[contains(.,"encryptedpool")])[1]/../a/u').click()
    assert wait_on_element(driver, 5, '//h1[contains(.,"Error details for encryptedpool")]')
    assert wait_on_element(driver, 5, '//textarea[contains(.,"Provided key is invalid")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    assert wait_on_element(driver, 5, '//h1[contains(.,"Unlock Datasets")]')
    assert wait_on_element(driver, 5, '//p[contains(.,"These datasets could not be unlocked")]')
    assert wait_on_element(driver, 5, '(//strong[contains(.,"encryptedpool")])[1]/../a/u')
    driver.find_element_by_xpath('(//strong[contains(.,"encryptedpool")])[1]/../a/u').click()
    assert wait_on_element(driver, 5, '//h1[contains(.,"Error details for encryptedpool")]')
    assert wait_on_element(driver, 5, '//textarea[contains(.,"Invalid Key")]')
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CLOSE"]').click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__CONTINUE"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__CONTINUE"]').click()
    time.sleep(1)
    assert wait_on_element(driver, 7, '//td[@id="tbody__name_encryptedpool"]/span/span/mat-icon')
    wait_for_attribute_value(driver, 5, '//td[@id="tbody__name_encryptedpool"]/span/span/mat-icon', 'fonticon', 'mdi-lock')
