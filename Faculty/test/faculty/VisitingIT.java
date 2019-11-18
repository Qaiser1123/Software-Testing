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
public class VisitingIT {
    
    public VisitingIT() {
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

    
    @Test
    public void testVisitinginfo(){
      //  System.out.println("facultyinfo");
        //Visiting instance = null;
        //instance.facultyinfo();
        // TODO review the generated test code and remove the default call to fail.
        //fail("The test case is a prototype.");
    Visiting test1= new Visiting("Qaiser","Assistant",123456,1878,"17th june 1986","25 june 2010");
       String result= test1.designation;
       assertEquals("Assistant",result);
       //int res= test1.cnic;
       //assertEquals(1234,res);
    }
    @Test
    public void testVisitinginfoo(){
    Visiting test1= new Visiting("Qaiser","Assistant",123456,1878,"17th june 1986","25 june 2010");
    int res= test1.cnic;
    assertEquals(123,res);
    }
    @Test
    public void testVisitinginfoo0(){
    Visiting test2= new Visiting("Qaiser","Assistant",123456,1878,"17th june 1986","25 june 2010");
    float f= test2.basicsal;
    assertNotEquals(1123,f);
    }
}
    
