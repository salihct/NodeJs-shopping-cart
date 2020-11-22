var express = require('express');
var router = express.Router();
const productHelper = require('../helpers/product-helpers');
const userHelper = require('../helpers/user-helpers')
const verifyLoggIn = (req,res,next) =>{
  if(req.session.user){
    next()
  }else{
    res.redirect('/login')
  }
}
/* GET home page. */
router.get('/', async function(req, res, next) {
  let user = req.session.user
  // console.log(user);
  let cartCount = null
  if(req.session.user){
    cartCount =await userHelper.getCartCount(req.session.user._id)
  }
  productHelper.getAllProduct().then((products)=>{
    res.render('user/view-products', {products,user,cartCount});
  })
});

router.get('/login', (req,res)=>{
  if(req.session.user){
    res.redirect('/')
  }else{
    res.render('user/login',{"loginErr": req.session.userLogginErr})
    req.session.userLogginErr = false
  }
})

router.get('/signup', (req,res)=>{
  res.render('user/signup')
})

router.post('/signup', (req,res)=>{
  userHelper.doSignup(req.body).then((response)=>{
    // console.log(response);
    req.session.user = response.user
    req.session.user.loggedIn=true
    res.redirect('/')
  })
})

router.post('/login', (req,res)=>{
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.user = response.user
      req.session.user.loggedIn=true
      res.redirect('/')
    }else{
      req.session.userLogginErr = "Invalid email or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req,res)=>{
  req.session.user = null
  res.redirect('/')
})

router.get('/cart', verifyLoggIn, async(req,res) => {
  let products = await userHelper.getCartProducts(req.session.user._id)
  let total = 0
  if(products.length > 0){
    total = await userHelper.getTotalAmount(req.session.user._id)
  }
  res.render('user/cart', {products, user: req.session.user._id, total})
})

router.get('/add-to-cart/:id', (req,res) => {
  userHelper.addToCart(req.params.id, req.session.user._id).then(()=>{
    res.json({status: true})
  })
})

router.post('/change-product-quantity',(req,res,next)=>{
  userHelper.changeProductQuantity(req.body).then(async(response)=>{
    response.total = await userHelper.getTotalAmount(req.body.user)
    res.json(response)
  })
})

router.post('/remove-item',(req,res)=>{
  userHelper.removeItem(req.body).then(()=>{
    res.json({status:true})
  })
})

router.get("/place-order",verifyLoggIn,async(req,res)=>{
  let total = await userHelper.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total, user:req.session.user})
})

router.post('/place-order', async(req,res)=>{
  // console.log(req.body.userId);
  let products = await userHelper.getCartProductsList(req.body.userId)
  let totalAmount = await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body, products, totalAmount).then((orderId)=>{
    if(req.body.paymentMethod == 'COD'){
      res.json({codSuccess:true})
    }else{
      userHelper.generateRazorpay(orderId, totalAmount).then((response)=>{
        // console.log(response);
        res.json(response)
      })
    }
    
  })
})

router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user: req.session.user})
})

router.get('/orders',async(req,res)=>{
  let orders = await userHelper.getUserOrders(req.session.user._id)
  res.render('user/orders',{user: req.session.user, orders})
})

router.get('/view-order-products/:id',async(req,res)=>{
  let products = await userHelper.getOrderProducts(req.params.id)
  res.render('user/view-order-products',{user: req.session.user, products})
})

router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
  userHelper.verifyPayment(req.body).then(()=>{
    userHelper.changePaymentStatus(req.body['order[receipt]']).then(()=>{
      console.log("payment success");
      res.json({status:true})
    })
  }).catch((err)=>{
    console.log(err);
    res.json({status:false})
  })
})

module.exports = router;
