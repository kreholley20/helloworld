"use strict";

module.exports.calTdee = function(weight, gender, lean, activity, goal){
    let tdeeW = 0.0;
    //convert to kg
    tdeeW = tdeeW + weight / 2.2;
    if (gender === "female"){
        tdeeW = tdeeW * 0.9;
    }
    
    tdeeW = tdeeW * lean * activity * 24;
    if (goal === "1"){
        tdeeW = tdeeW + 300;
    } else if (goal === "2") {
        tdeeW = tdeeW - 300;
    }
 
    return tdeeW = parseInt(tdeeW);
}