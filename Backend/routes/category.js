const Category = require('../models/categories'); 

exports.getCategories = async (req, res) => {
  try {
    const categories = await Category.find(); 
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching categories', error });
  }
};
