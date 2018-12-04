# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 5

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
          'navAccount': '//*[@id="nav-1"]/div/a[1]',
          'submenuGroup': '//*[@id="1-0"]',
          'newGroupName': '//*[@id="bsdgrp_group"]/mat-input-container/div/div[1]/div/input',
          'fabTrigger': '//*[@id="myFab"]/div/smd-fab-trigger/button',
          'fabAction': '//*[@id="add_action_button"]',
          'saveButton': '//*[@id="save_button"]',
          'permitsudoCheckbox': '//*[@id="bsdgrp_sudo"]/mat-checkbox/label/div'
        }

class create_group_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    # Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_01_nav_acc_group(self):
        try:
            # Click  Account menu
            print (" navigating to the group submenu")
            driver.find_element_by_xpath(xpaths['navAccount']).click()
            time.sleep(1)
            # Click User submenu
            driver.find_element_by_xpath(xpaths['submenuGroup']).click()
            time.sleep(2)
            # get the ui element
            ui_element1=driver.find_element_by_xpath('//*[@id="breadcrumb-bar"]/ul/li[2]/a')
            # get the weather data
            page_data=ui_element1.text
            print ("the Page now is: " + page_data)
            # assert response
            self.assertTrue("Group" in page_data)
            # Taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    def test_02_create_newgroup(self):
        try:
            print (" creating a new group without root access")
            # scroll down to find hover tab
            driver.find_element_by_tag_name('html').send_keys(Keys.END)
            time.sleep(2)
            # Click create new group option
            driver.find_element_by_xpath(xpaths['fabAction']).click()
            # Enter New Groupname
            time.sleep(1)
            driver.find_element_by_xpath(xpaths['newGroupName']).send_keys(newgroupname)
            # Click on save new Group button
            driver.find_element_by_xpath(xpaths['saveButton']).click()
            #taking screenshot
            function.screenshot(driver, self)
            # check if there is a generic error when making a duplicate group, and print the error
            self.error_check()
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    def test_03_create_supergroup(self):
        try:
            print (" creating a new Super group with root access")
            time.sleep(1)
            # Click Group submenu
            driver.find_element_by_xpath(xpaths['submenuGroup']).click()
            time.sleep(1)
            # Click create new group option
            driver.find_element_by_xpath(xpaths['fabAction']).click()
            # Enter New Groupname
            time.sleep(1)
            driver.find_element_by_xpath(xpaths['newGroupName']).send_keys(supergroupname)
            # Check Permit Sudo  checkbox
            driver.find_element_by_xpath(xpaths['permitsudoCheckbox']).click()
            # Click on save new Group button
            driver.find_element_by_xpath(xpaths['saveButton']).click()
            #taking screenshot
            function.screenshot(driver, self)
            # check if there is a generic error when making a duplicate group, and print the error
            self.error_check()
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    def test_04_create_duplicategroup(self):
        try:
            print (" creating a duplicate group")
            # Click Group submenu
            driver.find_element_by_xpath(xpaths['submenuGroup']).click()
            # scroll down to find hover tab
            driver.find_element_by_tag_name('html').send_keys(Keys.END)
            time.sleep(2)
            # Click create new group option
            driver.find_element_by_xpath(xpaths['fabAction']).click()
            # Enter New Groupname
            time.sleep(1)
            driver.find_element_by_xpath(xpaths['newGroupName']).send_keys(newgroupname)
            # Click on save new Group button
            driver.find_element_by_xpath(xpaths['saveButton']).click()
            #taking screenshot
            function.screenshot(driver, self)
            # check if there is a generic error when making a duplicate group, and print the error
            self.error_check()
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")


    def test_05_close_navAccount(self):
        try:
            print (" closing account menu")
            driver.find_element_by_xpath(xpaths['navAccount']).click()
            time.sleep(20)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
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


    @classmethod
    def tearDownClass(inst):
        pass


def run_create_group_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(create_group_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)

