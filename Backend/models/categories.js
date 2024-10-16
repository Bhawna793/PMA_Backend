const mongoose = require('mongoose');


const CategorySchema = mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  subcategories: {
    type: Array, 
    default: []
  }
});

const Category = mongoose.model('Category', CategorySchema);


module.exports = Category;
