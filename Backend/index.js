const express = require('express');
const app = express();
const PORT = 8000;
const cors = require('cors');
const nodemailer=require('nodemailer')
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose=require('mongoose');
const user=require('./models/user');
const Category=require('./models/categories')
const products=require('./models/products');
const UserRoute=require('./routes/user')
const ProductRoute=require('./routes/product');
const jwt=require('jsonwebtoken');
var bcrypt = require('bcryptjs');
const path=require('path')
const categoriesController=require('./routes/category');



app.use(cors({
    origin: "http://localhost:4200",
    credentials: true,
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());

async function addSubcategoryToCategory(categoryName, subcategoryName) {
    try {
        let category = await Category.findOne({ name: categoryName });

        if (!category) {
            category = new Category({ name: categoryName, subcategories: [subcategoryName] });
            await category.save();
            console.log('Category created with subcategory:', categoryName, subcategoryName);
        } else {
            if (!category.subcategories.includes(subcategoryName)) {
                category.subcategories.push(subcategoryName);
                await category.save();
            } 
        }
    } catch (error) {
        console.error('Error adding subcategory:', error);
    }
}

async function add_data(){
await addSubcategoryToCategory('Electronics', 'Mobile Phones'); 
await addSubcategoryToCategory('Electronics','Laptops');
await addSubcategoryToCategory('Electronics','Smart Watch')
await addSubcategoryToCategory('Electronics','TV')
}

add_data()






app.use('/user',UserRoute);
app.use('/api',ProductRoute);
app.get('/categories',categoriesController.getCategories);
mongoose.connect("mongodb://127.0.0.1:27017/PMA").then(()=>{
    console.log("DB Connected");
})
  
app.listen(PORT, ()=> {
    console.log(`server started at ${PORT}`);
})
