require("dotenv").config();
const fs = require("fs");
const path = require("path");

exports.populateCreds = ()=>{
    const exists = fs.existsSync(path.join(__dirname,'..','/service_account.json'))
    if(exists){
        return
    }
    const creds = JSON.parse(JSON.stringify(process.env.CREDS));
    fs.writeFileSync(path.join(__dirname,'..','/service_account.json'),creds);
}

