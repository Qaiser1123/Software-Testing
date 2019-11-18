/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package faculty;

import org.junit.After;
import org.junit.AfterClass;
import org.junit.Before;
import org.junit.BeforeClass;
import org.junit.Test;
import static org.junit.Assert.*;

/**
 *
 * @author qhass
 */
public class PermanentIT {
    
    public PermanentIT() {
    }
    
    @BeforeClass
    public static void setUpClass() {
    }
    
    @AfterClass
    public static void tearDownClass() {
    }
    
    @Before
    public void setUp() {
    }
    
    @After
    public void tearDown() {
    }

    /**
     * Test of facultyinfo method, of class Permanent.
     */
    @Test
    public void testFacultyinfo() {
        String name="Qaiser";
        int CNIC=1234567;
        String Designation="Assistant";
        float BasicSal= 123456;
        String doj="17th june 1986";
        String res="25 june 2010";
       
       // System.out.println("facultyinfo");
        //Permanent instance = null;
        //instance.facultyinfo();
        // TODO review the generated test code and remove the default call to fail.
        //fail("The test case is a prototype.");
        Permanent test= new Permanent("Qaiser",1234567,"Assistant",123456,"17th june 1986","25 june 2010");
       String result= test.dateofjoin;
       assertEquals("17th june 1985",result);  // fail
    }
    @Test
     public void testFacultyinfo1() {
       
         
          Permanent test1= new Permanent("Qaiser",1234567,"Assistant",123456,"17th june 1986","25 june 2010");
          String n=test1.name;
          assertEquals("Qaiser",n);  // pass
          
         
         
     }
     
      @Test
     public void testFacultyinfo2() {
      
         
          Permanent test1= new Permanent("Qaiser",1234567,"Assistant",123456,"17th june 1986","25 june 2010");
          int s=test1.cnic;
          assertNotEquals(123456,s);  // pass
          
         
     }
     
     
     }
    

