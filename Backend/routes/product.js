const express=require('express');
const router=express.Router();
const multer=require('multer');
const { uploadProducts,getProduct,getProductsByUser} =require('../controllers/product');


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

router.get("/myProducts", getProductsByUser)

module.exports=router;