require('dotenv').config()
const JWT_SECRET = process.env.JWT_SECRET;
const jwt = require("jsonwebtoken");

const express = require('express');
const app = express();
const PORT = 8000;
const cors = require('cors');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose=require('mongoose');
const user=require('./models/user');
const Category=require('./models/categories')
const products=require('./models/products');
const UserRoute=require('./routes/user')
const ProductRoute=require('./routes/product');
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
   await addSubcategoryToCategory('Electronics','Mobile');
   await addSubcategoryToCategory('Electronics','Laptop');
   await addSubcategoryToCategory('Electronics','Tablets');
   await addSubcategoryToCategory('Electronics','Smart Watch');


   await addSubcategoryToCategory('Books','Fiction');
   await addSubcategoryToCategory('Books','Non-Fiction');
   await addSubcategoryToCategory('Books','Kids Supplies');
   await addSubcategoryToCategory('Books','Office Supplies');


   await addSubcategoryToCategory('Foods','Snacks');
   await addSubcategoryToCategory('Foods','Beverages');
   await addSubcategoryToCategory('Foods','Fresh Produce');
   await addSubcategoryToCategory('Foods','Canned Foods');

   await addSubcategoryToCategory('Beauty and Health','Skincare');
   await addSubcategoryToCategory('Beauty and Health','Haircare');
   await addSubcategoryToCategory('Beauty and Health','Makeup');
   await addSubcategoryToCategory('Beauty and Health','Health Supplements');

   await addSubcategoryToCategory('Home and Living','Furniture');
   await addSubcategoryToCategory('Home and Living','KitchenWare');
   await addSubcategoryToCategory('Home and Living','Home Decor');
   await addSubcategoryToCategory('Home and Living','Beddings');

   await addSubcategoryToCategory('Fashion','Mens Wear');
   await addSubcategoryToCategory('Fashion','Womens Wear');
   await addSubcategoryToCategory('Fashion','Kids Wear');


}

add_data();

app.post('/api/verify-email', async (req, res) => {
    const { token } = req.body;
  console.log(req.body);
    try {
        
      const decoded = jwt.verify(token, JWT_SECRET);
      console.log("decoded",decoded);
      const email = decoded.email;
      console.log("email",email);

      const user1 = await user.findOne({ email, verificationToken: token });

      console.log("user found")
  
      if (!user1) {
        return res.status(400).json({ message: 'Invalid token or user' });
      }
  
      user1.isVerified = true;
      user1.verificationToken = null; 
      await user1.save();
  
      res.status(200).json({ message: 'Email verified successfully' });
    } catch (error) {
      res.status(400).json({ message: 'Token verification failed', error });
    }
  });
  

app.use('/user',UserRoute);
app.use('/api',ProductRoute);
app.get('/categories',categoriesController.getCategories);
mongoose.connect("mongodb://127.0.0.1:27017/PMA").then(()=>{
    console.log("DB Connected");
})
  
app.listen(PORT, ()=> {
    console.log(`server started at ${PORT}`);
})
