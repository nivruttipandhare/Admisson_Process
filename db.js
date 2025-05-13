let mysql=require("mysql");
let conn=mysql.createConnection({
    host:'localhost',
    user:'root',
    password:'coder',
    database:'nodeexpress'

})
conn.connect((err)=>{
    if(err){
        console.error("Some Issue");
        
    }else{
        console.log("DB is Connected");
        
    }
})
module.exports=conn;