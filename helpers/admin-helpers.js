var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')

module.exports = {
    getAllOrders:()=>{
        return new Promise(async(resolve,reject)=>{
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find().toArray()
            resolve(orders)
        })
    },
    getAllusers: ()=>{
        return new Promise(async(resolve,reject)=>{
            let users = await db.get().collection(collection.USER_COLLECTION).find().toArray()
            resolve(users)
        })
    },
    doLogin: (adminData) => {
        return new Promise(async(resolve,reject)=>{
            let response = {}
            let admin = await db.get().collection(collection.ADMIN_COLLECTION).findOne({email: adminData.email})
            if(admin) {
                bcrypt.compare(adminData.password, admin.password).then((status)=>{
                    if(status){
                        console.log("Login success");
                        response.admin = admin
                        response.status = true
                        resolve(response)
                    }else{
                        console.log("Login failed 1")
                        resolve({status: false})
                    }
                })
            }else{
                console.log("Login failed 2");
                resolve({status: false})
            }
        })
    },
    doSignup:(adminData)=>{
        return new Promise(async(resolve,reject)=>{
            adminData.password = await bcrypt.hash(adminData.password,10)
            db.get().collection(collection.ADMIN_COLLECTION).insertOne(adminData).then((data)=>{
                resolve(data.ops[0])
            })
        })
    }
}