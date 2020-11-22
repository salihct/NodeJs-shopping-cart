var db = require('../config/connection')
var collection = require('../config/collections')
const bcrypt = require('bcrypt')
var objectId = require('mongodb').ObjectID
const Razorpay = require('razorpay')
var instance = new Razorpay({
    key_id: 'rzp_test_NDtsOV7RgyowuD',
    key_secret: 'swHbevObE4Bc3wjopdm4U2a7',
  });
  

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
                    .updateOne({user:objectId(userId), 'products.item': objectId(prdctId)},
                    {
                        $inc: {'products.$.quantity': 1}
                    }).then(()=>{
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
            let total = await db.get().collection(collection.CART_COLECTION).aggregate([
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
                },
                {
                    $project: {
                        item:1, quantity:1, product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray()
            resolve(total)
            
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
    },
    changeProductQuantity: (details)=>{
        details.count = parseInt(details.count)
        details.quantity = parseInt(details.quantity)
        return new Promise((resolve,reject)=>{
            if(details.count == -1 && details.quantity == 1){
                db.get().collection(collection.CART_COLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item: objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve({removeProduct: true})
                })
            }else{
                db.get().collection(collection.CART_COLECTION)
                .updateOne({_id:objectId(details.cart), 'products.item': objectId(details.product)},
                {
                    $inc: {'products.$.quantity': details.count}
                }
                ).then(()=>{
                    resolve({status: true})
                })
            }
            
        })
    },
    removeItem: (details) => {
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.CART_COLECTION)
                .updateOne({_id:objectId(details.cart)},
                {
                    $pull:{products:{item: objectId(details.product)}}
                }
                ).then((response)=>{
                    resolve()
                })
            })
    },
    getTotalAmount: (userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cartData = await db.get().collection(collection.CART_COLECTION).findOne({user: objectId(userId)})
            if(cartData){
                let total = await db.get().collection(collection.CART_COLECTION).aggregate([
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
                    },
                    {
                        $project: {
                            item:1, quantity:1, product:{$arrayElemAt:['$product',0]}
                        }
                    },
                    {
                        $group:{
                            _id: null,
                            total:{$sum: {$multiply:['$quantity','$product.price']}}
                        }
                    }
                ]).toArray()
                resolve(total[0].total)
            }        
        })
    },
    placeOrder: (details,products,total)=>{
        return new Promise((resolve,reject)=>{
            let status = details.paymentMethod === 'COD' ? 'placed' : 'pending'
            var date = new Date()
            date = date.toLocaleFormat('%A, %B %e, %Y');
            let orderObj = {
                deliveryDetails: {
                    name: details.firstName + details.lastName,
                    address: details.address,
                    address2: details.address2,
                    pin: details.zip 
                },
                userId: objectId(details.userId),
                paymentMethod: details.paymentMethod,
                products: products,
                totalAmount: total,
                status: status,
                date: new Date()
            }
            db.get().collection(collection.ORDER_COLLECTION).insertOne(orderObj).then((response)=>{
                db.get().collection(collection.CART_COLECTION).removeOne({user:objectId(details.userId)})
                resolve(response.ops[0]._id)
            })
        })
    },
    getCartProductsList: (userId)=>{
        return new Promise(async(resolve,reject)=>{
            let cart = await db.get().collection(collection.CART_COLECTION).findOne({user: objectId(userId)})
            resolve(cart.products)
        })
    },
    getUserOrders: (userId)=>{
        return new Promise(async(resolve,reject)=>{
            let orders = await db.get().collection(collection.ORDER_COLLECTION).find({userId: objectId(userId)}).toArray()
            resolve(orders)
        })
    },
    getOrderProducts:(orderId)=>{
        return new Promise(async(resolve,reject)=>{
            let orderItems = await db.get().collection(collection.ORDER_COLLECTION).aggregate([
                {
                    $match: {_id: objectId(orderId)}
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
                },
                {
                    $project: {
                        item:1, quantity:1, product:{$arrayElemAt:['$product',0]}
                    }
                }
            ]).toArray() 
            resolve(orderItems)
        })
    },
    generateRazorpay: (orderId, totalAmount)=>{
        return new Promise((resolve,reject)=>{
            var options = {  
                amount: totalAmount*100,  // amount in the smallest currency unit  
                currency: "INR",  
                receipt: ""+orderId
            };
            instance.orders.create(options, function(err, order) { 
                if(err){
                    console.log(err);
                }else{
                    resolve(order)
                } 
            });
        })
    },
    verifyPayment: (details)=>{
        return new Promise((resolve,reject)=>{
            const crypto = require('crypto');
            let hmac = crypto.createHmac('sha256', 'swHbevObE4Bc3wjopdm4U2a7');
            hmac.update(details['payment[razorpay_order_id]']+'|'+details['payment[razorpay_payment_id]'])
            hmac=hmac.digest('hex')
            if(hmac==details['payment[razorpay_signature]']){
                resolve()
            }else{
                reject()
            }
        })
    },
    changePaymentStatus: (orderId)=>{
        return new Promise((resolve,reject)=>{
            db.get().collection(collection.ORDER_COLLECTION)
                .updateOne({_id:objectId(orderId)},
                {
                    $set:{
                        status: 'placed'
                    }
                }
                ).then(()=>{
                    resolve()
                })
        })
    }
}