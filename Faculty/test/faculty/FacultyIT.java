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
public class FacultyIT {
    
    public FacultyIT() {
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
     * Test of Facultyinfo method, of class Faculty.
     */
    //@Test
    //public void testFacultyinfo() {
      //  System.out.println("Facultyinfo");
        //Faculty instance = null;
        //instance.Facultyinfo();
        // TODO review the generated test code and remove the default call to fail.
        //fail("The test case is a prototype.");
    //}

    /**
     * Test of main method, of class Faculty.
     */
    @Test
    public void test1() {
       // System.out.println("main");
        //String[] args = null;
        //Faculty.main(args);
        // TODO review the generated test code and remove the default call to fail.
        //fail("The test case is a prototype.");
        Faculty fac= new Faculty("Qaiser Hassan","Professor",123456,3456.84f);
        fac.setcnic(123456);
        int result=fac.getcnic();   // pass
        assertEquals(123456,result);
    }
    @Test
    public void test2()
    {
        Faculty fac1= new Faculty("Qaiser Hassan","Professor",123456,3456.84f);
        float salary=fac1.basicsal;
        assertEquals(123456,salary);   // fail
       // assertEqauls(3456.84f,salary);
    }
     @Test
    public void test3()
    {
        Faculty fac1= new Faculty("Qaiser Hassan","Professor",123456,3456.84f);
        float salary=fac1.basicsal;
        assertNotEquals(123456,salary);    // pass
        
    }
    @Test
     public void test4()
    {
        Faculty fac1= new Faculty("Qaiser Hassan","Professor",123456,3456.84f);
        String des=fac1.designation;
        assertNotEquals("Assistant",des);    // pass
         
    }
    
    
    
    
}
