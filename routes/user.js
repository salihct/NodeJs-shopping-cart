const { response, json } = require('express');
var express = require('express');
var router = express.Router();
const productHelper = require('../helpers/product-helpers')
const userHelper = require('../helpers/user-helpers')
const verifyLoggIn = (req,res,next) =>{
  if(req.session.loggedIn){
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
  if(req.session.loggedIn){
    res.redirect('/')
  }else{
    res.render('user/login',{"loginErr": req.session.logginErr})
    req.session.logginErr = false
  }
})

router.get('/signup', (req,res)=>{
  res.render('user/signup')
})

router.post('/signup', (req,res)=>{
  userHelper.doSignup(req.body).then((response)=>{
    // console.log(response);
    req.session.loggedIn=true
    req.session.user = response.user
    res.redirect('/')
  })
})

router.post('/login', (req,res)=>{
  userHelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.loggedIn=true
      req.session.user = response.user
      res.redirect('/')
    }else{
      req.session.logginErr = "Invalid email or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req,res)=>{
  req.session.destroy()
  res.redirect('/')
})

router.get('/cart', verifyLoggIn, async(req,res) => {
  let products = await userHelper.getCartProducts(req.session.user._id)
  let total = await userHelper.getTotalAmount(req.session.user._id)
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
  console.log(req.body.userId);
  let products = await userHelper.getCartProductsList(req.body.userId)
  let totalAmount = await userHelper.getTotalAmount(req.body.userId)
  userHelper.placeOrder(req.body, products, totalAmount).then(()=>{
    res.json({status:true})
  })
})

module.exports = router;
