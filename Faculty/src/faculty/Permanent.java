/*
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
package faculty;

/**
 *
 * @author qhass
 */
public class Permanent extends Faculty{
    protected String dateofjoin,resign;
    Permanent(String Name, int CNIC,String Designation,float BasicSal,String doj,String res)
    {
        super(Name,Designation,CNIC,BasicSal);
       dateofjoin=doj;
       resign=res;
    }
    public void facultyinfo()
    {
        System.out.println("name of faculty member is "+ super.name);
        System.out.println("cnic of faculty member is "+ super.cnic);
        System.out.println("designation of faculty is "+ super.designation);
        System.out.println("date of joining is:"+ dateofjoin);
        System.out.println("resign date is: "+ resign);
     
        float sala= super.basicsal;
        String desig= super.designation;
        if(desig=="lecturer")
            sala=(float)(sala*0.10);
        else if(desig=="Associate Professor")
            sala=(float)(sala*0.05);
        else if(desig=="professor")
            sala=(float)(sala*0.03);
        else if(desig=="Assistant professor")
            sala=(float)(sala*0.07);
    System.out.println("Basic salary according to designation is:"+ sala);
    }
    
}
