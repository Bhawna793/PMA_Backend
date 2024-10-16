const products=require('../models/products')
const multer=require('multer');
const path=require('path')
const {getUser}=require('../service/auth')


async function uploadProducts(req,res){
    try {
        const currUser=getUser(req.cookies.refreshToken);

        if (!req.files.coverImage || req.files.coverImage.length === 0) {
            return res.status(400).json({ error: 'Cover image is required.' });
        }

        const coverImagePath = req.files.coverImage[0].path; 
        const imagePaths = req.files.images ? req.files.images.map(file => file.path) : []; 
  
        const product = new products({
            name: req.body.name,
            price: req.body.price,
            description: req.body.description,
            category: req.body.category,
            quantity:req.body.Quantity,
            subcategory:req.body.subcategory,
            coverImage: coverImagePath,
            images: imagePaths, 
            discount: req.body.discount,
            createdBy:currUser._id,
        });
  
        await product.save(); 
        res.status(201).json({ message: 'Product created successfully', product });
    } catch (error) {
        console.error('Error during file upload:', error); 
        res.status(500).json({ error: 'An error occurred while creating the product' });
    }
 
}

async function getProduct(req,res){
    try {
        const product = await products.find();
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching products' });
        console.log(error)
    }
}

module.exports={
    uploadProducts,
    getProduct,
}