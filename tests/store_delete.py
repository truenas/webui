# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 10

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
        'navStorage' : '//*[@id="nav-5"]/div/a[1]',
        'submenuPool' : '//*[@id="5-0"]',
        'submenuDisks' : '//*[@id="5-3"]',
        'confirmCheckbox': '//*[contains(@name, "confirm_checkbox")]',
        'deleteButton': '//*[contains(@name, "ok_button")]'
        }

class delete_pool_test(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    # Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_00_nav_store_pool(self):
        try:
            # Click  Storage menu
            print (" navigating to the Pool submenu")
            # allowing the button to load
            time.sleep(1)
            # Click Storage menu
            driver.find_element_by_xpath(xpaths['navStorage']).click()
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
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")

    def test_01_delete_pool1(self):
        try:
            print (" deleting a pool: " + pool1)
            time.sleep(2)
            function.pool_detach(driver, self, pool1)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")
            #temporary
            driver.refresh()

    def test_02_delete_pool2(self):
        try:
            print (" deleting a pool: " + pool2)
            time.sleep(2)
            function.pool_detach(driver, self, pool2)
            #taking screenshot
            function.screenshot(driver, self)
        except Exception:
            exc_info_p = traceback.format_exception(*sys.exc_info())
            #taking screenshot
            function.screenshot(driver, self)
            for i in range(1,len(exc_info_p)):
                print (exc_info_p[i].rstrip())
            self.assertEqual("Just for fail", str(Exception), msg="Test fail: Please check the traceback")
            #temporary
            driver.refresh()

    def test_03_close_navStorage(self):
        try:
            print (" closing Storage menu")
            driver.find_element_by_xpath(xpaths['navStorage']).click()
            function.screenshot(driver, self)
            time.sleep(20)
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

def run_delete_pool_test(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(delete_pool_test)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
