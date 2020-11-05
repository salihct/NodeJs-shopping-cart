var db = require('../config/connection')
var collection = require('../config/collections')
var objectId = require('mongodb').ObjectID
module.exports = {
    addProduct: (product, callback) => {
        db.get().collection('product').insertOne(product).then((data) => {
            callback(data.ops[0]._id)
        })
    },
    getAllProduct: () => {
        return new Promise(async(resolve,reject)=>{
            let products = await db.get().collection(collection.PRODUCT_COLECTION).find().toArray()
            resolve(products)
        })
    },
    deleteProduct: (prdctId) => {
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.PRODUCT_COLECTION).removeOne({_id: objectId(prdctId)}).then((response)=>{
                resolve(response)
            })
        })
    } 
 }