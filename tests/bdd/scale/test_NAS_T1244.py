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


@then('click on the the lock button of the encrypted pool')
def click_on_the_the_lock_button_of_the_encrypted_pool(driver):
    """click on the the lock button of the encrypted pool."""
    assert wait_on_element(driver, 4, xpaths.dataset.lock_button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.lock_button).click()
    assert wait_on_element(driver, 10, xpaths.lockDataset.title)

    assert wait_on_element(driver, 10, xpaths.lockDataset.forceUnmount_checkbox, 'clickable')
    driver.find_element_by_xpath(xpaths.lockDataset.forceUnmount_checkbox).click()
    assert wait_on_element(driver, 5, xpaths.lockDataset.lock_button, 'clickable')
    driver.find_element_by_xpath(xpaths.lockDataset.lock_button).click()

    assert wait_on_element(driver, 10, xpaths.dataset.lockPool_icon)


@then('try to unlock the pool with a wrong passphrase it should fail')
def try_to_unlock_the_pool_with_a_wrong_passphrase_it_should_fail(driver):
    """try to unlock the pool with a wrong passphrase it should fail."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
    assert wait_on_element(driver, 7, xpaths.dataset.pool_tree_name('encrypted_pool'))
    driver.find_element_by_xpath(xpaths.dataset.pool_tree('encrypted_pool')).click()
    assert wait_on_element(driver, 7, xpaths.dataset.pool_selected('encrypted_pool'))
    assert wait_on_element(driver, 4, xpaths.dataset.unlock_button, 'clickable')
    driver.find_element_by_xpath(xpaths.dataset.unlock_button).click()
    assert wait_on_element(driver, 10, xpaths.unlockDataset.title)
    assert wait_on_element(driver, 5, xpaths.unlockDataset.datasetPassphrase_input, 'inputable')
    driver.find_element_by_xpath(xpaths.unlockDataset.datasetPassphrase_input).clear()
    driver.find_element_by_xpath(xpaths.unlockDataset.datasetPassphrase_input).send_keys("wrongpassphrase")
    assert wait_on_element(driver, 5, xpaths.button.save, 'clickable')
    driver.find_element_by_xpath(xpaths.button.save).click()
    assert wait_on_element(driver, 10, '//p[contains(.,"The following datasets cannot be unlocked.")]')
    assert wait_on_element(driver, 5, xpaths.button.CONTINUE, 'clickable')
    driver.find_element_by_xpath(xpaths.button.CONTINUE).click()

    assert wait_on_element(driver, 10, '//p[contains(.,"These datasets could not be unlocked.")]')
    assert wait_on_element(driver, 10, xpaths.button.CLOSE, 'clickable')
    driver.find_element_by_xpath(xpaths.button.CLOSE).click()

    assert wait_on_element(driver, 10, xpaths.dataset.lockPool_icon)


@then(parsers.parse('try to unlock the pool with the right passphrase "{passphrase}" it should succeed'))
def try_to_unlock_the_pool_with_the_right_passphrase_passphrase_it_should_succeed(driver, passphrase):
    """try to unlock the pool with the right passphrase "{passphrase}" it should succeed."""
    assert wait_on_element(driver, 7, xpaths.dataset.title)
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
