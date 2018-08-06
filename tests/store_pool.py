# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 6

import function
from source import *
from selenium.webdriver.common.keys import Keys
from selenium import webdriver
from selenium.webdriver.support.ui import Select
from selenium.webdriver.common.by import By
from selenium.common.exceptions import ElementNotVisibleException
from selenium.common.exceptions import NoSuchElementException
from selenium.webdriver.support.ui import WebDriverWait
from selenium.webdriver.support import expected_conditions as EC
from selenium.webdriver.common.action_chains import ActionChains

#error handling/screenshotsave
import sys
import traceback
import os
cwd = str(os.getcwd())

import time
import unittest
import xmlrunner
import random
try:
    import unittest2 as unittest
except ImportError:
    import unittest


xpaths = {
        'navStorage': '//*[@id="nav-5"]/div/a[1]',
        'submenuPool': '//*[@id="5-1"]',
        'newUser': '//*[@id="username"]/mat-input-container/div/div[1]/div/input',
        'addAction': '//*[@id="add_action_button"]',
        'frowardButton': '//*[@id="goforward_button"]',
        'poolName': '/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/app-manager/mat-card/div[2]/div/div[1]/div/mat-input-container/div/div[1]/div/input',
        'disk1Checkbox': '/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/app-manager/mat-card/div[2]/div/div[2]/div[1]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[1]/datatable-body-row/div[2]/datatable-body-cell[1]/div/div/mat-checkbox/label/div',
        'diskselectedMove': '/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/app-manager/mat-card/div[2]/div/div[2]/div[2]/div/app-vdev/div/div[1]/button[1]',
        'createButton': '/html/body/app-root/app-admin-layout/mat-sidenav-container/mat-sidenav-content/div/app-manager/mat-card/div[2]/div/div[4]/button[1]',
        'confirmcheckbox': '/html/body/div[4]/div[2]/div/mat-dialog-container/confirm-dialog/div[2]/mat-checkbox/label/div',
        'okButton': '//*[contains(text(), "Ok")]'
        }


class create_pool_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    # Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_01_nav_store_pool(self):
        try:
            self.error_check()
            # Click  Storage menu
            print (" navigating to the Storage/pool submenu")
            a = driver.find_element_by_xpath(xpaths['navStorage'])
            a.click()
            # allowing the button to load
            time.sleep(1)
            # Click Pool submenu
            driver.find_element_by_xpath(xpaths['submenuPool']).click()
            # get the ui element
            ui_element=driver.find_element_by_xpath('//*[@id="breadcrumb-bar"]/ul/li[2]/a')
            # get the weather data
            page_data=ui_element.text
            print ("the Page now is: " + page_data)
            # assert response
            self.assertTrue("Pools" in page_data)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i])
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    def test_02_create_newpool(self):
        try:
            print (" creating a new pool with 1 disk")
            # cancelling the tour
            if function.is_element_present(driver, self, By.XPATH, '/html/body/div[6]/div[1]/button'):
                driver.find_element_by_xpath('/html/body/div[6]/div[1]/button').click()
            time.sleep(1)
            # Click create new user option
            driver.find_element_by_xpath(xpaths['fabAction']).click()
            # Enter New Username
            driver.find_element_by_xpath(xpaths['newUser']).send_keys(newusername)
            # Enter User Full name
            driver.find_element_by_xpath(xpaths['newUserName']).send_keys(newuserfname)
            # Enter User email id
            driver.find_element_by_xpath(xpaths['newUserEmail']).send_keys(newuseremail)
            # Enter Password
            driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
            # Enter Password Conf
            driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
            # Click on create new User button
            if driver.find_element_by_xpath(xpaths['saveButton']):
                print ("found the save button")
                driver.find_element_by_xpath(xpaths['saveButton']).click()
            else:
                print ("could not find the save button and clicking")
#            if driver.find_element_by_xpath(xpaths['saveButton']):
#                print ("found the save button second time and clicking")
#                driver.find_element_by_xpath(xpaths['saveButton']).click()
#            else:
#                print ("could not find the save button")

            # check if there is a generic error when making a duplicate user, and print the error
            time.sleep(1)
            #taking screenshot
            function.screenshot(driver, self)
            self.error_check()
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i])
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_03_create_newuser_primarygroup_uncheck(self):
        try:
            time.sleep(2)
            print (" creating a new user without creating a primary group")
            # Click User submenu
            driver.find_element_by_xpath(xpaths['submenuUser']).click()
            # scroll down to find hover tab
            driver.find_element_by_tag_name('html').send_keys(Keys.END)
            time.sleep(2)
            # Perform hover to show menu
            hover_element = driver.find_element_by_xpath(xpaths['fabTrigger'])
            hover = ActionChains(driver).move_to_element(hover_element)
            hover.perform()
            time.sleep(1)
            # Click create new user option
            driver.find_element_by_xpath(xpaths['fabAction']).click()
            # Enter New Username
            driver.find_element_by_xpath(xpaths['newUser']).send_keys(newusernameuncheck)

#temporary turn off dropdownlist test
            # uncheck create primary group  Checkbox
#            driver.find_element_by_xpath(xpaths['primaryGroupcheckbox']).click()
            # click on primary group dropdownlist
#            driver.find_element_by_xpath(xpaths['primaryGroupdropdown']).click()
#            if driver.find_element_by_xpath(xpaths['primaryGroupdropdown']).click():
#                driver.find_element_by_xpath(xpaths['primaryGroupdropdown']).click()
            # select the element from the dropdown list by using selectlist function
#            time.sleep(2)
#            print ("attempt")
#            Select(driver.find_element_by_xpath(xpaths['primaryGroupdropdown'])).select_by_visible_text("userNAS")
#            print ("made")
#            driver.find_element_by_xpath('//*[contains(text(), "userNAS")]').click()
            # Enter User Full name
            driver.find_element_by_xpath(xpaths['newUserName']).send_keys(newuserfnameuncheck)
            # Enter Password
            driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
            # Enter Password Conf
            driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
            # Click on create new User button
            if driver.find_element_by_xpath(xpaths['saveButton']):
                print ("found the save button")
                driver.find_element_by_xpath(xpaths['saveButton']).click()
            else:
                print ("could not find the save button and clicking")
            #taking screenshot
            function.screenshot(driver, self)
            # check if there is a generic error when making a duplicate user, and print the error
            time.sleep(1)
            self.error_check()
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i])
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    def test_04_create_superuser(self):
        try:
            print (" creating a super user with root access")
            time.sleep(2)
            # Click User submenu
            driver.find_element_by_xpath(xpaths['submenuUser']).click()
            # scroll down to find hover tab
            driver.find_element_by_tag_name('html').send_keys(Keys.END)
            time.sleep(2)
            # Perform hover to show menu
            hover_element = driver.find_element_by_xpath(xpaths['fabTrigger'])
            hover = ActionChains(driver).move_to_element(hover_element)
            hover.perform()
            time.sleep(1)
            # Click create new user option
            driver.find_element_by_xpath(xpaths['fabAction']).click()
            # Enter New Username
            driver.find_element_by_xpath(xpaths['newUser']).send_keys(superusername)
            # Enter User Full name
            driver.find_element_by_xpath(xpaths['newUserName']).send_keys(superuserfname)
            # Enter Password
            driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(superuserpassword)
            # Enter Password Conf
            driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(superuserpassword)
            # check Permit Sudo Checkbox
            driver.find_element_by_xpath(xpaths['permitSudocheckbox']).click()
            # Click on create new User button
            if driver.find_element_by_xpath(xpaths['saveButton']):
                print ("found the save button")
                driver.find_element_by_xpath(xpaths['saveButton']).click()
            else:
                print ("could not find the save button and clicking")
            #taking screenshot
            function.screenshot(driver, self)
            # check if there is a generic error when making a duplicate user, and print the error
            time.sleep(1)
            self.error_check()
            # check if the the user list is loaded after addding a new user
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i])
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_05_create_duplicateuser(self):
        try:
            print (" creating a duplicate user")
            # Click User submenu
            driver.find_element_by_xpath(xpaths['submenuUser']).click()
            # cancelling the tour
            if function.is_element_present(driver, self, By.XPATH,'/html/body/div[6]/div[1]/button'):
                driver.find_element_by_xpath('/html/body/div[6]/div[1]/button').click()
            # scroll down to find hover tab
            driver.find_element_by_tag_name('html').send_keys(Keys.END)
            time.sleep(2)
            # Perform hover to show menu
            hover_element = driver.find_element_by_xpath(xpaths['fabTrigger'])
            hover = ActionChains(driver).move_to_element(hover_element)
            hover.perform()
            time.sleep(1)
            # Click create new user option
            driver.find_element_by_xpath(xpaths['fabAction']).click()
            # Enter New Username
            driver.find_element_by_xpath(xpaths['newUser']).send_keys(newusername)
            # Enter User Full name
            driver.find_element_by_xpath(xpaths['newUserName']).send_keys(newuserfname)
            # Enter Password
            driver.find_element_by_xpath(xpaths['newUserPass']).send_keys(newuserpassword)
            # Enter Password Conf
            driver.find_element_by_xpath(xpaths['newUserPassConf']).send_keys(newuserpassword)
            # Click on create new User button
            if driver.find_element_by_xpath(xpaths['saveButton']):
                print ("found the save button")
                driver.find_element_by_xpath(xpaths['saveButton']).click()
            else:
                print ("could not find the save button and clicking")
            #taking screenshot
            function.screenshot(driver, self)
            # check if there is a generic error when making a duplicate user, and print the error
            time.sleep(1)
            self.error_check()
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i])
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_06_close_navAccount(self):
        try:
            print (" closing account menu")
            driver.find_element_by_xpath(xpaths['navAccount']).click()
            self.screenshot("_")
            time.sleep(20)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            self.screenshot("-e")
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i])
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    # Next step-- To check if the new user is present in the list via automation


    def error_check(self):
        if function.is_element_present(driver, self, By.XPATH, '//*[contains(text(), "Close")]'):
            if function.is_element_present(driver, self, By.XPATH,'/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1'):
                ui_element=driver.find_element_by_xpath('/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1')
                error_element=ui_element.text
                print (error_element)
            driver.find_element_by_xpath('//*[contains(text(), "Close")]').click()
            print ("Duplicate user cannot be created")
        if function.is_element_present(driver, self, By.XPATH, '//*[contains(text(), "Close")]'):
            if function.is_element_present(driver, self, By.XPATH,'/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1'):
                ui_element=driver.find_element_by_xpath('/html/body/div[5]/div[2]/div/mat-dialog-container/error-dialog/h1')
                error_element=ui_element.text
                print (error_element)
            driver.find_element_by_xpath('//*[contains(text(), "Close")]').click()
            print ("Duplicate user cannot be created")


    def selectlist(self, element):
        for i in range(0,10):
            if function.is_element_present(driver, self, By.XPATH, '/html/body/div[4]/div[2]/div/div/md-option[' + str(i) + ']'):
                dropdown_el = driver.find_element_by_xpath('/html/body/div[4]/div[2]/div/div/md-option[' + str(i) + ']')
                dropdown_text = dropdown_el.text
                if dropdown_text == element:
                    dropdown_el.click()
                    break


    @classmethod
    def tearDownClass(inst):
        pass

def run_create_pool_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(create_pool_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
