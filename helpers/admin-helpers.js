var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectID

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
    }
}