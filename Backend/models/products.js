const mongoose = require('mongoose');


const ProductSchema = mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true
  },
  subcategory: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  
  coverImage:{
    type:String,
    required:true,
  },
  images: {
    type: [String], 
  },
  discount: {
    type: Number,
    default: 0 
  },
  quantity:{
    type:Number,
    default:1
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "users",
  }
});

module.exports = mongoose.model('Product', ProductSchema);
