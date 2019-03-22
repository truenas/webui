# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 7

import sys
import os
import time
from selenium.webdriver.common.keys import Keys
from selenium.webdriver.common.by import By
cwd = str(os.getcwd())
sys.path.append(cwd)
from function import take_screenshot, is_element_present
from source import *


skip_mesages = "Skipping first run"
script_name = os.path.basename(__file__).partition('.')[0]

xpaths = {
        # 'navAccount': '//*[@id="nav-1"]/div/a[1]',
        'navAccount': "//span[contains(.,'Accounts')]",
        'submenuUser': '//*[@id="1-1"]',
        'submenuGroup': '//*[@id="1-0"]',
        'primaryGroupcheckbox': '//*[@id="group_create"]/mat-checkbox/label/div',
        'primaryGroupdropdown': '//*[@id="group"]',
        'newUserName': "//div[@id='full_name']/mat-form-field/div/div/div/input",
        'newUser': "//div[@id='username']/mat-form-field/div/div/div/input",
        'newUserEmail': "//div[@id='email']/mat-form-field/div/div/div/input",
        'newUserPass': "//div[@id='password']/mat-form-field/div/div/div/input",
        'newUserPassConf': "//div[@id='password_conf']/mat-form-field/div/div/div/input",
        'permitSudocheckbox': '//*[@id="sudo"]/mat-checkbox/label/div',
        'fabAction': "//button[@id='add_action_button']",
        'saveButton': '//*[@id="save_button"]'
}


def test_00_set_implicitly_wait(wb_driver):
    wb_driver.implicitly_wait(1)


# Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
def test_01_nav_acc_user(wb_driver):
    error_check(wb_driver)
    # Click  Account menu
    print(" navigating to the user submenu")
    wb_driver.find_element_by_xpath(xpaths['navAccount']).click()
    # allowing the button to load
    time.sleep(1)
    # Click User submenu
    wb_driver.find_element_by_xpath(xpaths['submenuUser']).click()
    # get the ui element
    ui_element = wb_driver.find_element_by_xpath('//*[@id="breadcrumb-bar"]/ul/li[2]/a')
    # get the weather data
    page_data = ui_element.text
    print("the Page now is: " + page_data)
    # assert response
    assert "User" in page_data, page_data
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)


def test_02_create_newuser(wb_driver):
    print(" creating a new user with create new primary group")
    # cancelling the tour
    if is_element_present(wb_driver, By.XPATH, '/html/body/div[6]/div[1]/button'):
        wb_driver.find_element_by_xpath('/html/body/div[6]/div[1]/button').click()
    # scroll down to find hover tab
    wb_driver.find_element_by_tag_name('html').send_keys(Keys.END)
    time.sleep(2)
    # Click create new user option
    wb_driver.find_element_by_xpath(xpaths['fabAction']).click()
    # Enter User Full name
    wb_driver.find_element_by_xpath(xpaths['newUserName']).send_keys(newuserfname)
    # clear user name and enter new Username
    wb_driver.find_element_by_xpath(xpaths['newUser']).clear()
    wb_driver.find_element_by_xpath(xpaths['newUser']).send_keys(newusername)
    # Enter User email id
    wb_driver.find_element_by_xpath(xpaths['newUserEmail']).send_keys(newuseremail)
    # Enter Password
    wb_driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
    # Enter Password Conf
    wb_driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
    # Click on create new User button
    if wb_driver.find_element_by_xpath(xpaths['saveButton']):
        print("found the save button")
        wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    else:
        print("could not find the save button and clicking")

    # check if there is a generic error when making a duplicate user, and print the error
    time.sleep(1)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    error_check(wb_driver)


def test_03_create_newuser_primarygroup_uncheck(wb_driver):

    time.sleep(2)
    # Click User submenu
    wb_driver.find_element_by_xpath(xpaths['submenuUser']).click()
    # scroll down to find hover tab
    wb_driver.find_element_by_tag_name('html').send_keys(Keys.END)
    time.sleep(2)
    # Click create new user option
    wb_driver.find_element_by_xpath(xpaths['fabAction']).click()
    # Enter User Full name
    wb_driver.find_element_by_xpath(xpaths['newUserName']).send_keys(newuserfnameuncheck)
    # clear user name and enter new Username
    wb_driver.find_element_by_xpath(xpaths['newUser']).clear()
    wb_driver.find_element_by_xpath(xpaths['newUser']).send_keys(newusernameuncheck)

    # Enter Password
    wb_driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
    # Enter Password Conf
    wb_driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
    # Click on create new User button
    if wb_driver.find_element_by_xpath(xpaths['saveButton']):
        print("found the save button")
        wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    else:
        print("could not find the save button and clicking")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    # check if there is a generic error when making a duplicate user, and print the error
    time.sleep(1)
    error_check(wb_driver)


def test_04_create_superuser(wb_driver):
    print(" creating a super user with root access")
    time.sleep(2)
    # Click User submenu
    wb_driver.find_element_by_xpath(xpaths['submenuUser']).click()
    # scroll down to find hover tab
    wb_driver.find_element_by_tag_name('html').send_keys(Keys.END)
    time.sleep(2)
    # Click create new user option
    wb_driver.find_element_by_xpath(xpaths['fabAction']).click()

    # Enter User Full name
    wb_driver.find_element_by_xpath(xpaths['newUserName']).send_keys(superuserfname)
    # clear user name and enter new Username
    wb_driver.find_element_by_xpath(xpaths['newUser']).clear()
    wb_driver.find_element_by_xpath(xpaths['newUser']).send_keys(superusername)

    # Enter Password
    wb_driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(superuserpassword)
    # Enter Password Conf
    wb_driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(superuserpassword)
    # check Permit Sudo Checkbox
    wb_driver.find_element_by_xpath(xpaths['permitSudocheckbox']).click()
    # Click on create new User button
    if wb_driver.find_element_by_xpath(xpaths['saveButton']):
        print("found the save button")
        wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    else:
        print("could not find the save button and clicking")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    # check if there is a generic error when making a duplicate user, and print the error
    time.sleep(1)
    error_check(wb_driver)


def test_05_create_duplicateuser(wb_driver):
    print(" creating a duplicate user")
    # Click User submenu
    wb_driver.find_element_by_xpath(xpaths['submenuUser']).click()
    # cancelling the tour
    if is_element_present(wb_driver, By.XPATH, '/html/body/div[6]/div[1]/button'):
        wb_driver.find_element_by_xpath('/html/body/div[6]/div[1]/button').click()
    # scroll down to find hover tab
    wb_driver.find_element_by_tag_name('html').send_keys(Keys.END)
    time.sleep(2)
    # Click create new user option
    wb_driver.find_element_by_xpath(xpaths['fabAction']).click()

    # Enter User Full name
    wb_driver.find_element_by_xpath(xpaths['newUserName']).send_keys(newuserfname)
    # clear user name and enter new Username
    wb_driver.find_element_by_xpath(xpaths['newUser']).clear()
    wb_driver.find_element_by_xpath(xpaths['newUser']).send_keys(newusername)

    # Enter Password
    wb_driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
    # Enter Password Conf
    wb_driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
    # Click on create new User button
    if wb_driver.find_element_by_xpath(xpaths['saveButton']):
        print("found the save button")
        wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    else:
        print("could not find the save button and clicking")
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    # check if there is a generic error when making a duplicate user, and print the error
    time.sleep(1)
    error_check(wb_driver)


def test_06_create_newuser_suggestedname(wb_driver):
    print(" creating a new user with suggested name")
    # Click User submenu
    wb_driver.find_element_by_xpath(xpaths['submenuUser']).click()
    # cancelling the tour
    if is_element_present(wb_driver, By.XPATH, '/html/body/div[6]/div[1]/button'):
        wb_driver.find_element_by_xpath('/html/body/div[6]/div[1]/button').click()
    # scroll down to find hover tab
    wb_driver.find_element_by_tag_name('html').send_keys(Keys.END)
    time.sleep(2)
    # Click create new user option
    wb_driver.find_element_by_xpath(xpaths['fabAction']).click()
    # Enter User Full name
    wb_driver.find_element_by_xpath(xpaths['newUserName']).send_keys(newuserfname)

    # not required since UI auto fills suggested username
    # wb_driver.find_element_by_xpath(xpaths['newUser']).clear()
    # wb_driver.find_element_by_xpath(xpaths['newUser']).send_keys(newusername)
    # Enter User email id

    wb_driver.find_element_by_xpath(xpaths['newUserEmail']).send_keys(newuseremail)
    # Enter Password
    wb_driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
    # Enter Password Conf
    wb_driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
    # Click on create new User button
    if wb_driver.find_element_by_xpath(xpaths['saveButton']):
        print("found the save button")
        wb_driver.find_element_by_xpath(xpaths['saveButton']).click()
    else:
        print("could not find the save button and clicking")

    # check if there is a generic error when making a duplicate user, and print the error
    time.sleep(1)
    # taking screenshot
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    error_check(wb_driver)


def test_07_close_navAccount(wb_driver):
    print(" closing account menu")
    wb_driver.find_element_by_xpath(xpaths['navAccount']).click()
    test_name = sys._getframe().f_code.co_name
    take_screenshot(wb_driver, script_name, test_name)
    time.sleep(20)


# Next step-- To check if the new user is present in the list via automation


def error_check(wb_driver):
    if is_element_present(wb_driver, By.XPATH, '//*[contains(text(), "Close")]'):
        if is_element_present(wb_driver, By.XPATH, '/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1'):
            ui_element = wb_driver.find_element_by_xpath('/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1')
            error_element = ui_element.text
            print(error_element)
        wb_driver.find_element_by_xpath('//*[contains(text(), "Close")]').click()
        print("Duplicate user cannot be created")
    if is_element_present(wb_driver, By.XPATH, '//*[contains(text(), "Close")]'):
        if is_element_present(wb_driver, By.XPATH, '/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1'):
            ui_element = wb_driver.find_element_by_xpath('/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1')
            error_element = ui_element.text
            print(error_element)
        wb_driver.find_element_by_xpath('//*[contains(text(), "Close")]').click()
        print("Duplicate user cannot be created")


def selectlist(element, wb_driver):
    for i in range(0, 10):
        if is_element_present(wb_driver, By.XPATH, '/html/body/div[4]/div[2]/div/div/md-option[' + str(i) + ']'):
            dropdown_el = wb_driver.find_element_by_xpath('/html/body/div[4]/div[2]/div/div/md-option[' + str(i) + ']')
            dropdown_text = dropdown_el.text
            if dropdown_text == element:
                dropdown_el.click()
                break
