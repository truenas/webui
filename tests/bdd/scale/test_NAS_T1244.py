# coding=utf-8
"""SCALE UI: feature tests."""

import xpaths
from function import (
    wait_on_element,
    is_element_present
)
from pytest_bdd import (
    given,
    scenario,
    then,
    when,
)
from pytest_dependency import depends


@scenario('features/NAS-T1244.feature', 'Verify locking and unlocking volume using passphrase')
def test_verify_locking_and_unlocking_volume_using_passphrase():
    """Verify locking and unlocking volume using passphrase."""


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
        driver.find_element_by_xpath(xpaths.login.password_input).clear()
        driver.find_element_by_xpath(xpaths.login.password_input).send_keys(root_password)
        assert wait_on_element(driver, 5, xpaths.login.signin_button)
        driver.find_element_by_xpath(xpaths.login.signin_button).click()
    else:
        driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()


@when('you are on the dashboard, click Storage on the side menu')
def you_are_on_the_dashboard_click_storage_on_the_side_menu(driver):
    """you are on the dashboard, click Storage on the side menu."""
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.dashboard, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.dashboard).click()
    assert wait_on_element(driver, 10, xpaths.dashboard.title)
    assert wait_on_element(driver, 10, xpaths.sideMenu.storage, 'clickable')
    driver.find_element_by_xpath(xpaths.sideMenu.storage).click()


@then('lock the pool when the pool page reloads')
def lock_the_pool_when_the_pool_page_reloads(driver):
    """lock the pool when the pool page reloads."""
    assert wait_on_element(driver, 5, '//tr[contains(.,"encrypted_tank")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Lock"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Lock"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Lock Dataset encrypted_tank")]')

    assert wait_on_element(driver, 10, '//mat-checkbox[@ix-auto="checkbox__FORCE UNMOUNT"]', 'clickable')
    driver.find_element_by_xpath('//mat-checkbox[@ix-auto="checkbox__FORCE UNMOUNT"]').click()
    assert wait_on_element(driver, 10, xpaths.checkbox.confirm, 'clickable')
    driver.find_element_by_xpath(xpaths.checkbox.confirm).click()
    assert wait_on_element(driver, 5, '//button[@ix-auto="button__LOCK"]', 'clickable')
    driver.find_element_by_xpath('//button[@ix-auto="button__LOCK"]').click()

    assert wait_on_element(driver, 10, '//mat-icon[@fonticon="mdi-lock"]')


@then('enter 1234abcd and verify that an error shows')
def enter_1234abcd_and_verify_that_an_error_shows(driver):
    """enter 1234abcd and verify that an error shows."""

    assert wait_on_element(driver, 5, '//tr[contains(.,"encrypted_tank")]//mat-icon[text()="more_vert"]', 'clickable')
    driver.find_element_by_xpath('//tr[contains(.,"tank")]//mat-icon[text()="more_vert"]').click()
    assert wait_on_element(driver, 4, '//button[normalize-space(text())="Unlock"]', 'clickable')
    driver.find_element_by_xpath('//button[normalize-space(text())="Unlock"]').click()
    assert wait_on_element(driver, 10, '//h1[contains(.,"Unlock Datasets")]')
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Dataset Passphrase"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Dataset Passphrase"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Dataset Passphrase"]').send_keys("1234abcd")
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element(driver, 10, '//p[contains(.,"The following datasets cannot be unlocked.")]')
    assert wait_on_element(driver, 5, '//mat-dialog-container//button[@ix-auto="button__CLOSE"]', 'clickable')
    driver.find_element_by_xpath('//mat-dialog-container//button[@ix-auto="button__CLOSE"]').click()


@then('enter abcd1234 and confirm')
def enter_abcd1234_and_confirm(driver):
    """enter abcd1234 and confirm."""
    assert wait_on_element(driver, 5, '//input[@ix-auto="input__Dataset Passphrase"]', 'inputable')
    driver.find_element_by_xpath('//input[@ix-auto="input__Dataset Passphrase"]').clear()
    driver.find_element_by_xpath('//input[@ix-auto="input__Dataset Passphrase"]').send_keys("abcd1234")
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()


@then('unlock the pool')
def unlock_the_pool(driver):
    """unlock the pool."""
    assert wait_on_element(driver, 10, '//p[contains(.,"These datasets will be unlocked with the provided credentials.")]')
    assert wait_on_element(driver, 5, xpaths.button.Continue, 'clickable')
    driver.find_element_by_xpath(xpaths.button.Continue).click()

    assert wait_on_element(driver, 10, '//p[contains(.,"These datasets were successfully unlocked.")]')
    assert wait_on_element(driver, 10, xpaths.button.close, 'clickable')
    driver.find_element_by_xpath(xpaths.button.close).click()
    assert wait_on_element(driver, 10, '//mat-icon[@fonticon="mdi-lock-open-variant"]')
