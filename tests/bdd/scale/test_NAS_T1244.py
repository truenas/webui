# coding=utf-8
"""SCALE UI: feature tests."""

import reusableSeleniumCode as rsc
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
    parsers
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


@then('click on the the lock button of the encrypted pool')
def click_on_the_the_lock_button_of_the_encrypted_pool(driver):
    """click on the the lock button of the encrypted pool."""
    assert wait_on_element(driver, 4, xpaths.dataset.lock_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.lock_Button).click()
    assert wait_on_element(driver, 10, xpaths.lock_Dataset.title)

    assert wait_on_element(driver, 10, xpaths.lock_Dataset.force_Unmount_Checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.lock_Dataset.force_Unmount_Checkbox).click()
    assert wait_on_element(driver, 5, xpaths.lock_Dataset.lock_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.lock_Dataset.lock_Button).click()

    assert wait_on_element(driver, 10, xpaths.dataset.lock_Pool_Icon)


@then('try to unlock the pool with a wrong passphrase it should fail')
def try_to_unlock_the_pool_with_a_wrong_passphrase_it_should_fail(driver):
    """try to unlock the pool with a wrong passphrase it should fail."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Tree_Name('encrypted_pool'))
    driver.find_element_by_xpath(xpaths.dataset.pool_Tree('encrypted_pool')).click()
    assert wait_on_element(driver, 7, xpaths.dataset.pool_Selected('encrypted_pool'))
    assert wait_on_element(driver, 4, xpaths.dataset.unlock_Button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.unlock_Button).click()
    assert wait_on_element(driver, 10, xpaths.unlock_Dataset.title)
    assert wait_on_element(driver, 5, xpaths.unlock_Dataset.dataset_Passphrase_Input, 'inputable')
    driver.find_element_by_xpath(xpaths.unlock_Dataset.dataset_Passphrase_Input).clear()
    driver.find_element_by_xpath(xpaths.unlock_Dataset.dataset_Passphrase_Input).send_keys("wrongpassphrase")
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element(driver, 10, '//p[contains(.,"The following datasets cannot be unlocked.")]')
    assert wait_on_element(driver, 5, xpaths.button.CONTINUE, 'clickable')
    driver.find_element_by_xpath(xpaths.button.CONTINUE).click()

    assert wait_on_element(driver, 10, '//p[contains(.,"These datasets could not be unlocked.")]')
    assert wait_on_element(driver, 10, xpaths.button.CLOSE, 'clickable')
    driver.find_element_by_xpath(xpaths.button.CLOSE).click()

    assert wait_on_element(driver, 10, xpaths.dataset.lock_Pool_Icon)


@then(parsers.parse('try to unlock the pool with the right passphrase "{passphrase}" it should succeed'))
def try_to_unlock_the_pool_with_the_right_passphrase_passphrase_it_should_succeed(driver, passphrase):
    """try to unlock the pool with the right passphrase "{passphrase}" it should succeed."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
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
