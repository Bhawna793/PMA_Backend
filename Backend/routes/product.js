const express=require('express');
const router=express.Router();
const multer=require('multer');
const path=require('path')
const { uploadProducts,getProduct} =require('../controllers/product');
const products=require('../models/products')


const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); 
    }
  })
  
  const upload = multer({ storage: storage })

router.post("/products", upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'images', maxCount: 10 }]),uploadProducts)

router.get("/products",getProduct);

  module.exports=router;