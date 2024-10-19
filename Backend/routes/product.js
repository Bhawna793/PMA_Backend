const express=require('express');
const router=express.Router();
const multer=require('multer');
const { uploadProducts,getProduct, getProductsByUser, deleteProduct, updateProduct} =require('../controllers/product');
const { checkAuth } = require('../middlewares/auth');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/')
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname); 
    }
  })
  
  const upload = multer({ storage: storage })

router.post("/products", checkAuth, upload.fields([{ name: 'coverImage', maxCount: 1 }, { name: 'images', maxCount: 10 }]), uploadProducts)

router.get("/products", getProduct);

router.get("/myProducts", checkAuth, getProductsByUser)

router.delete("/myProducts/:id", checkAuth, deleteProduct)

router.patch("/myProducts/:id", checkAuth, updateProduct);

module.exports=router;