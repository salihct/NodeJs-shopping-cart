var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')
var fs = require('fs');
const adminHelpers = require('../helpers/admin-helpers');

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelper.getAllProduct().then((products)=>{
    res.render('admin/view-products', {admin:true,products})
  })
});

router.get('/all-products',(req,res)=>{
  res.redirect('/admin')
})

router.get('/add-product',function(req,res){
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

// router.get('/login', (req,res)=>{
//   if(req.session.admin){
//     res.redirect('/')
//   }else{
//     res.render('user/login',{"loginErr": req.session.userLogginErr})
//     req.session.adminLogginErr = false
//   }
// })

router.get('/all-orders',async(req,res)=>{
  let orders = await adminHelpers.getAllOrders()
  res.render('admin/all-orders',{orders, admin:true})
})

router.get('/all-users',async(req,res)=>{
  let orders = await adminHelpers.getAllusers()
  res.render('admin/all-users',{orders, admin:true})
})

module.exports = router;
