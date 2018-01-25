# Author: Rishabh Chauhan
# License: BSD
# Location for tests  of FreeNAS new GUI
#Test case count: 2

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

xpaths = { 'XPATH1' : "//*[@id='1']/form-input/div/md-input-container/div/div[1]/div/input",
          'XPATH2' : "//*[@id='2']/form-checkbox/div/md-checkbox/label/div",
         'XPATH' : "//*[@id='3']/form-select/div/md-select/div"
          }


class check_serv_smb(unittest.TestCase):
    @classmethod
    def setUpClass(inst):
        driver.implicitly_wait(30)
        pass

    #Test navigation Account>Users>Hover>New User and enter username,fullname,password,confirmation and wait till user is  visibile in the list
    def test_01_nameofthe_testcase(self):
        #Click an element indirectly
        a = driver.find_element_by_xpath("XPATH1")
        a.click()
        #allowing page to load by giving explicit time(in seconds)
        time.sleep(1)
        #Click an element directly
        driver.find_element_by_xpath("XPATH2").click()
        #cancelling the tour
        if self.is_element_present(By.XPATH,"/html/body/div[4]/div[1]/button"):
            driver.find_element_by_xpath("/html/body/div[4]/div[1]/button").click()
        #Checking and executing if the condition is true
        if self.is_element_present(By.XPATH,"XPATH"):
            driver.find_element_by_xpath("XPATH").click()

        #scroll down to find an element
        driver.find_element_by_tag_name('html').send_keys(Keys.END)
        #give some sleep time

        #Perform HOVER
        hover_element = driver.find_element_by_xpath("XPATH OF THE HOVER ELEMENT")
        hover = ActionChains(driver).move_to_element(hover_element)
        hover.perform()
        time.sleep(1)

        #Enter in a textbox using an external variable
        driver.find_element_by_xpath("XPATH OF THE TEXTBOX").send_keys(EXTERNAL_VARIABLE)
        #Enter in a textbox without a variable
        driver.find_element_by_xpath("XPATH OF THE TEXTBOX").send_keys("STRING TO BE ENTERED")
        #check if an element is found, if not display an ERROR
        self.assertTrue(self.is_element_present(By.XPATH, "XPATH OF THE ELEMENT TO BE FOUND"), "ERROR")


        #get the ui element content
        ui_element_page=driver.find_element_by_xpath("XPATH OF THE UI ELEMENT")
        #get the text of element data  into page_data
        page_data=ui_element_page.text
        print ("the Page now is: " + page_data)
        #assert response to check if "Certain_String" is in the page_data 
        self.assertTrue("Certain_String" in page_data)
        #similarly if status_data = page_data
        #conditional execution(eg-toggle service on/off based on current status)
        print "current status is: " + status_data
        if status_data == "stopped": 
            #Click on the toggle button if the current status = stopped and print changing status
            driver.find_element_by_xpath("XPATH OF THE STATUS TEXT").click()
            time.sleep(1)
            print ("the status has now changed to running")
        else:
            #otheriwse just print status
            print ("the status is--: " + status_data)


    #method to test if an element is present
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
        #Click User submenu
        driver.find_element_by_xpath(xpaths['submenuUser']).click()
        #click on the item per page option
        driver.find_element_by_xpath("//*[@id='entity-table-component']/div[3]/md-paginator/div[1]/md-select/div").click()
        #click select the highest number i.e 100
        driver.find_element_by_xpath("/html/body/div[3]/div[2]/div/div/md-option[4]").click()
        #wait till the list is loaded
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

        #click on the 3 dots
        driver.find_element_by_xpath("//*[@id='entity-table-component']/div[5]/ngx-datatable/div/datatable-body/datatable-selection/datatable-scroller/datatable-row-wrapper[" + str(index) + "]/datatable-body-row/div[2]/datatable-body-cell[7]/div/app-entity-table-actions/div/md-icon").click()
        #click on delete option
        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div/div/span[2]/button/div").click()
        #click on confirmation checkbox
        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div[2]/md-dialog-container/confirm-dialog/div[1]/md-checkbox/label/div").click()
        #click on Ok
        driver.find_element_by_xpath("/html/body/div[3]/div[3]/div[2]/md-dialog-container/confirm-dialog/div[2]/button[1]").click()
        print (newusernameuncheck + " deleted")


    @classmethod
    def tearDownClass(inst):
        #if not the last module
        pass
        #if it is the last module
        #driver.close()

def run_check_serv_smb(webdriver):
    global driver
    driver = webdriver
    suite = unittest.TestLoader().loadTestsFromTestCase(check_serv_smb)
    xmlrunner.XMLTestRunner(output=results_xml, verbosity=2).run(suite)
