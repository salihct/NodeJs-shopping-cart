var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
var fs = require('fs');
const adminHelpers = require('../helpers/admin-helpers');
const verifyLoggIn = (req,res,next) =>{
  if(req.session.adminLoggedIn){
    next()
  }else if(req.path === '/'){
    res.redirect('admin/login')
  }else{
    res.redirect('login')
  }
}

/* GET users listing. */
router.get('/', verifyLoggIn, function(req, res, next) {
  let admin = req.session.admin
  productHelper.getAllProduct().then((products)=>{
    res.render('admin/view-products', {admin:true, products, admin})
  })
});

router.get('/all-products',verifyLoggIn, (req,res)=>{
  res.redirect('/admin')
})

router.get('/add-product', verifyLoggIn, function(req,res){
  res.render('admin/add-product',{admin:true})
})

router.post('/add-product',function(req,res) {
    
  productHelper.addProduct(req.body, (id) => {
    let image = req.files.image
    image.mv('./public/product-images/'+id+'.jpg', (err,done) => {
      if(!err) {
        res.render('admin/add-product')
      }else{
        console.log(err);
      }
    })
  })
})

router.get('/delete-product/:id', (req,res)=>{
  let prdctId = req.params.id
  productHelpers.deleteProduct(prdctId).then((response)=>{
    res.redirect('/admin/')
  })
  fs.unlinkSync('./public/product-images/'+prdctId+'.jpg');
  // console.log(prdctId);
})

router.get('/edit-product/:id', async(req,res)=>{
  let product = await productHelper.getProductDetails(req.params.id)
  res.render('admin/edit-product', {product, admin:true})
})

router.post('/edit-product/:id', (req,res)=>{
  productHelper.updateProduct(req.params.id, req.body).then(()=>{
    res.redirect('/admin/')
    if(req.files.image){
      let image = req.files.image
      image.mv('./public/product-images/'+req.params.id+'.jpg')
    }
  })
})

router.get('/login', (req,res)=>{
  if(req.session.admin){
    res.redirect('/admin',{admin: true})
  }else{
    res.render('admin/login',{"loginErr": req.session.userLogginErr, admin: true})
    req.session.adminLogginErr = false
  }
})

router.post('/login', (req,res)=>{
  adminHelpers.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.admin = response.admin
      req.session.adminLoggedIn=true
      res.redirect('/admin')
    }else{
      req.session.userLogginErr = "Invalid email or password"
      res.redirect('/login')
    }
  })
})

router.get('/logout', (req,res)=>{
  req.session.admin = null
  res.redirect('/')
})

router.get('/admin-signup', (req,res)=>{
  res.render('admin/admin-signup')
})

router.post('/admin-signup', (req,res)=>{
  adminHelpers.doSignup(req.body).then((response)=>{
    // console.log(response);
    req.session.admin = response.admin
    req.session.adminLoggedIn=true
    res.redirect('/admin',{admin:true})
  })
})

router.get('/all-orders', verifyLoggIn, async(req,res)=>{
  let orders = await adminHelpers.getAllOrders()
  res.render('admin/all-orders',{orders, admin:true})
})

router.get('/all-users', verifyLoggIn, async(req,res)=>{
  let orders = await adminHelpers.getAllusers()
  res.render('admin/all-users',{orders, admin:true})
})

module.exports = router;
