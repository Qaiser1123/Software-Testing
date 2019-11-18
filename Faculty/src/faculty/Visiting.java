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
public class Visiting extends Faculty{
    private String Contrsign,PaydelDate;
    Visiting(String Name,String Designation,int CNIC, float BasicSal,String contsign,String Paydate)
    {
        super(Name,Designation,CNIC,BasicSal);
        Contrsign=contsign;
        PaydelDate=Paydate;
    }
    public void facultyinfo()
    {
        System.out.println("name of faculty member is "+ super.name);
        System.out.println("cnic of faculty member is "+ super.cnic);
        System.out.println("designation of faculty is "+ super.designation);
        System.out.println("Contract signing day was :"+Contrsign );
        System.out.println("Pay delivery date is : "+PaydelDate);
        
        float sala=super.basicsal;
        sala=(float)(sala*0.17);
        System.out.println("salary of lecturer after tax deduction is: "+ sala);
     
        
    }
}
