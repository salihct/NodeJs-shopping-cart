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
        return new Promise(async(resolve,reject)=>{
            let userCart = await db.get().collection(collection.CART_COLECTION).findOne({user: objectId(userId)})
            if(userCart){
                db.get().collection(collection.CART_COLECTION)
                    .updateOne({user: objectId(userId)},
                    {
                        $push: {product: objectId(prdctId)}
                    }).then((response)=>{
                        resolve()
                    })
            }else{
                let cartObj={
                    user: objectId(userId),
                    product: [objectId(prdctId)]
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
                    $lookup:{
                        from: collection.PRODUCT_COLECTION,
                        let: {prdctList: '$product'},
                        pipeline:[
                            {
                                $match:{
                                    $expr:{
                                        $in:['$_id', '$$prdctList']
                                    }
                                }
                            }
                        ],
                        as: 'cartItems'
                    }
                }
            ]).toArray()
            resolve(cartItems[0].cartItems)
        })
    },
    getCartCount: (userId)=>{
        return new Promise(async(resolve,reject)=>{
            let count = 0
            let cart = await db.get().collection(collection.CART_COLECTION).findOne({user: objectId(userId)})
            if(cart) {
                count = cart.product.length
            }
            resolve(count)
        })
    }
}