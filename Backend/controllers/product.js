const products=require('../models/products')
const multer=require('multer');
const path=require('path')
const {getUser}=require('../service/auth')


async function uploadProducts(req,res){
    try {

        const existingProduct = await products.findOne({ name:req.body.name });
        if (existingProduct) {
            console.log("Product already exists")
            return res.status(400).json({ msg: "Product already exists" });
        }

        const priceValidationRegex = /^[0-9]{1,10}(\.\d{1,3})?$/;
        const discountValidationRegex=/^[0-9]{1,10}(\.\d{1,3})?$/;
        const nameValidationRegex=/^(?=.*[a-zA-Z])(?![0-9]+)[a-zA-Z0-9 ]{1,20}$/;
        const quantityValidationRegex = /^[1-9][0-9]*$/;

        if (!nameValidationRegex.test(req.body.name)) {
            console.log("Invalid name")
            return res.status(400).json({ 
                msg: "Invalid Name"
            });
        }


        if (!priceValidationRegex.test(req.body.price)) {
            console.log("Invalid price")
            return res.status(400).json({ 
                msg: "Invalid Price"
            });
        }

        if (!discountValidationRegex.test(req.body.discount)) {
            console.log("Invalid discount")
            return res.status(400).json({ 
                msg: "Invalid Discount"
            });
        }

        
        if (!quantityValidationRegex.test(req.body.Quantity)) {
            console.log("Invalid quantity")
            return res.status(400).json({ 
                msg: "Invalid Quantity"
            });
        }


        const currUser=getUser(req.cookies.accessToken);

        console.log(currUser)

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
            createdBy:currUser.curUser._id,
            seller:currUser.curUser.name,
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

async function getProductsByUser(req, res) {
    try {
        const accessToken = req.cookies?.accessToken;
        const data = getUser(accessToken);
        const userId = data.curUser._id;
        const product = await products.find({createdBy: userId});
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'An error occurred while fetching products'});
        console.log(error);
    }
}

module.exports={
    uploadProducts,
    getProduct,
    getProductsByUser,
}