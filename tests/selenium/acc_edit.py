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
        'navAccount' : '//*[@id="nav-1"]/div/a[1]',
        'submenuUser' : '//*[@id="1-1"]',
        'submenuGroup' : '//*[@id="1-0"]',
        }

class edit_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    # Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_01_00_nav_acc_user(self):
        try:
            # Click  Account menu
            print (" navigating to the user submenu")
            a = driver.find_element_by_xpath(xpaths['navAccount'])
            a.click()
            # allowing the button to load
            time.sleep(1)
            # Click User submenu
            driver.find_element_by_xpath(xpaths['submenuUser']).click()
            # get the ui element
            ui_element=driver.find_element_by_xpath('//*[@id="breadcrumb-bar"]/ul/li[2]/a')
            # get the weather data
            page_data=ui_element.text
            print ("the Page now is: " + page_data)
            # assert response
            self.assertTrue("User" in page_data)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    def test_01_01_edit_userNAS_email(self):
        try:
            print ("Change the email to test1@ixsystems.com ")
            time.sleep(2)
            #call edit funtion on the userNAS
            function.user_edit(driver, self, "user", newusername)
            # get the ui element
            ui_email=driver.find_element_by_xpath('//*[@id="email"]/mat-input-container/div/div[1]/div/input')
            ui_email.clear()
            ui_email.send_keys("test2@ixsystems.com")
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    def test_01_02_edit_userNAS_sudo(self):
        try:
            print ("Changing permission to sudo user ")
            # Changing permission to sudo
            ui_sudo=driver.find_element_by_xpath('//*[@id="sudo"]/mat-checkbox')
            function.user_edit(driver, self, "user", newusername)
            driver.find_element_by_xpath('//*[@id="save_button"]').click()
            time.sleep(15)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    def test_02_00_nav_acc_group(self):
        try:
            # Click  Account menu
            print (" navigating to the group submenu")
            # Click User submenu
            driver.find_element_by_xpath(xpaths['submenuGroup']).click()
            # get the ui element
            ui_element=driver.find_element_by_xpath('//*[@id="breadcrumb-bar"]/ul/li[2]/a')
            # get the weather data
            page_data=ui_element.text
            print ("the Page now is: " + page_data)
            # assert response
            self.assertTrue("Group" in page_data)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    def test_02_01_edit_groupNAS_sudo(self):
        try:
            print ("change permission of groupNAS to sudo")
            time.sleep(2)
            function.user_edit(driver, self, "group", newgroupname)
            driver.find_element_by_xpath('//*[@id="bsdgrp_sudo"]/mat-checkbox/label/div').click()
            driver.find_element_by_xpath('//*[@id="save_button"]').click()
            time.sleep(20)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")



    # Next step-- To check if the new user is present in the list via automation


    # method to test if an element is present
    def is_element_present(self, how, what):
        """
        Helper method to confirm the presence of an element on page
        :params how: By locator type
        :params what: locator value
        """
        try: driver.find_element(by=how, value=what)
        except NoSuchElementException: return False
        return True

    def error_check(self):
        if self.is_element_present(By.XPATH,'/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[1]/p'):
            ui_element=driver.find_element_by_xpath('/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[1]/p')
            error_element=ui_element.text
            print (error_element)
            driver.find_element_by_xpath('/html/body/div[3]/div/div[2]/md-dialog-container/error-dialog/div[2]/button').click()


    @classmethod
    def tearDownClass(inst):
        pass

def run_edit_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(edit_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
