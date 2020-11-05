const { response } = require('express');
var express = require('express');
const productHelpers = require('../helpers/product-helpers');
var router = express.Router();
var productHelper = require('../helpers/product-helpers')

/* GET users listing. */
router.get('/', function(req, res, next) {
  productHelper.getAllProduct().then((products)=>{
    res.render('admin/view-products', {admin:true,products})
  })
});

router.get('/add-product',function(req,res){
  res.render('admin/add-product')
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
  // console.log(prdctId);
})


module.exports = router;
