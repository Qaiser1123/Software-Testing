/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package faculty;

public class Faculty {

 protected String name,designation;
 protected int cnic;
 protected float basicsal;
 
 Faculty(String Name,String Designation,int CNIC, Float BasicSal)
 {
     name=Name;
     designation=Designation;
     cnic=CNIC;
     basicsal=BasicSal;
     
 }
 public void setcnic(int c)
 {
     cnic=c;
 }
 
 public int getcnic()
 {
     return cnic;
 }
 public void Facultyinfo()
 {
     System.out.println("PArent called");
 }
    public static void main(String[] args) {
       Permanent per= new Permanent("Qaiser Hassan",123456,"Professor",3456.84f,"11/06/2009","12/08/2017");
       Visiting vis= new Visiting("Babar","Lecturer",234523,5432.54f,"11/02/2013","13/07/2014");
       
       per.facultyinfo();
       vis.facultyinfo();
    }
    
}
