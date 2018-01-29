# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
# Test case count: 2

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


import time
import unittest
import xmlrunner
import random
try:
    import unittest2 as unittest
except ImportError:
    import unittest

xpaths = { 'navService' : "//*[@id='nav-8']/div/a[1]",
           'navSystem' : "//*[@id='nav-2']/div/a[1]",
           'submenuAdvanced' : "//*[@id='2-3']",
         }

class conf_system_advanced(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass
    
    # Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_01_nav_system_advanced(self):
        driver.find_element_by_xpath(xpaths['submenuAdvanced']).click()

        # cancelling the tour
        if self.is_element_present(By.XPATH,"/html/body/div[6]/div[1]/button"):
            driver.find_element_by_xpath("/html/body/div[6]/div[1]/button").click()

        # get the ui element
        ui_element=driver.find_element_by_xpath("//*[@id='breadcrumb-bar']/ul/li[2]/a")
        # get the weather data
        page_data=ui_element.text
        print ("the Page now is: " + page_data)
        # assert response
        self.assertTrue("Advanced" in page_data)

    def test_02_close_system_tab(self):
        # Close the System Tab
        driver.find_element_by_xpath(xpaths['navSystem']).click()
        time.sleep(5)




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

    def delete(self, name):
        # Click User submenu
        driver.find_element_by_xpath(xpaths['submenuUser']).click()
        # click on the item per page option
        driver.find_element_by_xpath("//*[@id='entity-table-component']/div[3]/md-paginator/div[1]/md-select/div").click()
        # click select the highest number i.e 100
        driver.find_element_by_xpath("/html/body/div[3]/div[2]/div/div/md-option[4]").click()
        # wait till the list is loaded
        time.sleep(5)
        index = 0
        ui_text = "null"
        for x in range(0, 5):
            if self.is_element_present(By.XPATH, "/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-user-list/entity-table/div/div[5]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[" + str(x) + "]/datatable-body-row/div[2]/datatable-body-cell[1]/div/div"):
                ui_element=driver.find_element_by_xpath("/html/body/app-root/app-admin-layout/md-sidenav-container/div[6]/div/app-user-list/entity-table/div/div[5]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[" + str(x) + "]/datatable-body-row/div[2]/datatable-body-cell[1]/div/div")
                ui_text = ui_element.text
            if (ui_text == name):
                index = x
                break
            ui_element = " "

        # click on the 3 dots
        driver.find_element_by_xpath("//*[@id='entity-table-component']/div[5]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[" + str(index) + "]/datatable-body-row/div[2]/datatable-body-cell[7]/div/app-entity-table-actions/div/md-icon").click()
        # click on delete option
        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div/div/span[2]/button/div").click()
        # click on confirmation checkbox
        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div[2]/md-dialog-container/confirm-dialog/div[1]/md-checkbox/label/div").click()
        # click on Ok
        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div[2]/md-dialog-container/confirm-dialog/div[2]/button[1]").click()
        print (newusernameuncheck + " deleted")


    @classmethod
    def tearDownClass(inst):
        pass

def run_conf_system_advanced(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(conf_system_advanced)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
