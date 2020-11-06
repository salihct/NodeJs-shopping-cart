var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
const { response } = require('express')
var objectId = require('mongodb').ObjectID

module.exports = {
    doSignup:(userData)=>{
        return new Promise(async(resolve,reject)=>{
            userData.password = await bcrypt.hash(userData.password,10)
            db.get().collection(collection.USER_COLLECTION).insertOne(userData).then((data)=>{
                resolve(data.ops[0])
            })
        })
    },

    doLogin: (userData) => {
        return new Promise(async(resolve,reject)=>{
            let loginStatus = false
            let response = {}
            let user = await db.get().collection(collection.USER_COLLECTION).findOne({email: userData.email})
            if(user) {
                bcrypt.compare(userData.password, user.password).then((status)=>{
                    if(status){
                        console.log("Login success");
                        response.user = user
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
    addToCart: (prdctId,userId)=>{
        let prdctObj ={
            item: objectId(prdctId),
            quantity: 1
        }
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(collection.CART_COLECTION).findOne({user: objectId(userId)})
            if(userCart){
                let prdctExist = userCart.products.findIndex(product => product.item == prdctId)
                if(prdctExist !=-1){
                    db.get().collection(collection.CART_COLECTION)
                    .updateOne({'products.item': objectId(prdctId)},
                    {
                        $inc: {'products.$.quantity': 1}
                    }).then((response)=>{
                        // console.log(response);
                        resolve()
                    })
                }else{
                    db.get().collection(collection.CART_COLECTION)
                    .updateOne({user: objectId(userId)},
                    {
                        $push: {products: prdctObj}
                    }).then((response)=>{
                        resolve()
                    })
                }
                
            }else{
                let cartObj={
                    user: objectId(userId),
                    products: [prdctObj]
                }
                db.get().collection(collection.CART_COLECTION).insertOne(cartObj).then((respone)=>{
                    resolve()
                })
            }
        })
    },
    getCartProducts: (userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartItems = await db.get().collection(collection.CART_COLECTION).aggregate([
                {
                    $match: {user: objectId(userId)}
                },
                {
                    $unwind: '$products'
                },
                {
                    $project: {
                        item: '$products.item',
                        quantity: '$products.quantity'
                    }
                },
                {
                    $lookup:{
                        from: collection.PRODUCT_COLECTION,
                        localField: 'item',
                        foreignField: '_id',
                        as: 'product'
                    }
                }
            ]).toArray()
            // console.log(cartItems);
            resolve(cartItems)
            
        })
    },
    getCartCount: (userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count = 0
            let cart = await db.get().collection(collection.CART_COLECTION).findOne({user: objectId(userId)})
            if(cart) {
                count = cart.products.length
            }
            resolve(count)
        })
    }
}