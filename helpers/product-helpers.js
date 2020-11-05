var db = require('../config/connection')
var collection = require('../config/collections')
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
    } 
 }