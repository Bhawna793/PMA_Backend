const products = require("../models/products");
const multer = require("multer");
const path = require("path");
const { getUser } = require("../service/auth");

function checkValidation(req) {
  const priceValidationRegex = /^[1-9][0-9]*$/;
  const discountValidationRegex = /^[0-9]+$/;
  const nameValidationRegex = /^(?=.*[a-zA-Z])(?![0-9]+)[a-zA-Z0-9 ]{1,20}$/;
  const quantityValidationRegex = /^[1-9][0-9]*$/;

  if (!nameValidationRegex.test(req.body.name)) {
    return res.status(400).json({
      msg: "Invalid Name",
    });
  }

  if (!priceValidationRegex.test(req.body.price)) {
    return res.status(400).json({
      msg: "Invalid Price",
    });
  }

  if (!discountValidationRegex.test(req.body.discount)) {
    return res.status(400).json({
      msg: "Invalid Discount",
    });
  }

  if (!quantityValidationRegex.test(req.body.Quantity)) {
    return res.status(400).json({
      msg: "Invalid Quantity",
    });
  }
}

async function uploadProducts(req, res) {
  try {
    if (
      !req.body.name ||
      !req.body.price ||
      !req.body.description ||
      !req.body.category ||
      !req.body.subcategory ||
      !req.body.discount ||
      !req.body.Quantity
    ) {
      return res.status(403).json({ msg: "Please fill your Credentials" });
    }

    checkValidation(req);
    const existingProduct = await products.findOne({ name: req.body.name });
    if (existingProduct) {
      return res.status(400).json({ msg: "Product already exists" });
    }

    const currUser = getUser(req.cookies.accessToken);

    if (!req.files.coverImage || req.files.coverImage.length === 0) {
      return res.status(400).json({ msg: "Cover image is required." });
    }
    if (!req.files.coverImage || req.files.coverImage.length === 0) {
      return res.status(400).json({ msg: "Cover image is required." });
    }

    const coverImagePath = req.files.coverImage[0].path;
    const imagePaths = req.files.images
      ? req.files.images.map((file) => file.path)
      : [];

    const product = new products({
      name: req.body.name,
      price: req.body.price,
      description: req.body.description,
      category: req.body.category,
      quantity: req.body.Quantity,
      subcategory: req.body.subcategory,
      coverImage: coverImagePath,
      images: imagePaths,
      discount: req.body.discount,
      createdBy: currUser.curUser._id,
      seller: currUser.curUser.name,
    });

    await product.save();
    res.status(201).json({ msg: "Product created successfully", product });
  } catch (error) {
    res
      .status(500)
      .json({ msg: "An error occurred while creating the product" });
  }
}

async function getProduct(req, res) {
  try {
    const product = await products.find({ isActive: true });
    res.json(product);
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching products" });
  }
}

async function getProductsByUser(req, res) {
  try {
    const userId = req.user._id;
    const pageNumber = +req.query.pageNumber;
    const pageSize = +req.query.pageSize;
    const sortBy = req.query.sortBy;
    const sortOrder = req.query.sortOrder === "asc" ? 1 : -1;
    const searchInput = req.query.searchInput;

    const searchFilter = searchInput
      ? {
          $or: [
            { category: { $regex: searchInput, $options: "i" } },
            { subcategory: { $regex: searchInput, $options: "i" } },
            { name: { $regex: searchInput, $options: "i" } },
            { seller: { $regex: searchInput, $options: "i" } },
            { description: { $regex: searchInput, $options: "i" } },
          ],
        }
      : {};

    const filter = { createdBy: userId, ...searchFilter };
    if (req.query.categoryName) filter.category = req.query.categoryName;
    if (req.query.subCategoryName)
      filter.subcategory = req.query.subCategoryName;
    if (req.query.isActive) filter.isActive = req.query.isActive;

    const totalProducts = await products
      .find(filter)
      .sort({ [sortBy]: sortOrder });

    const count = totalProducts.length;

    const product = await products
      .find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(pageSize * (pageNumber - 1))
      .limit(pageSize);

    res.json({ count, product });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while fetching products" });
  }
}

async function getProductById(req, res) {
  try {
    const _id = req.params.id;
    const product = await products.findOne({ _id });
    if (!product) {
      return res.status(404).json({ msg: "Product not found" });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ msg: "Something went wrong" });
  }
}

async function deleteProduct(req, res) {
  try {
    const _id = req.params.id;
    const curProduct = await products.findOne({ _id });
    if (!curProduct) {
      return res.status(404).json({ msg: "Product not found" });
    }
    if (!curProduct.isActive) {
      curProduct.isActive = true;
      curProduct.save();
      return res.status(200).json({ msg: "Product activated successfully" });
    }
    curProduct.isActive = false;
    curProduct.save();
    res.status(200).json({ msg: "Product deactivated successfully" });
  } catch (error) {
    res.status(500).json({ msg: "Error in performing action" });
  }
}

async function updateProduct(req, res) {
  try {
    checkValidation(req);
    const imagePaths = req.files.images
      ? req.files.images.map((file) => file.path)
      : [];

    const id = req.params.id;

    const updatedProduct = await products.findByIdAndUpdate(
      { _id: id },
      {
        category: req.body.category,
        subcategory: req.body.subcategory,
        name: req.body.name,
        price: req.body.price,
        discount: req.body.discount,
        quantity: req.body.Quantity,
        description: req.body.description,
        images: imagePaths,
      },
      {
        new: true,
      }
    );
    if (!updatedProduct) {
      return res.status(404).json({ msg: "Product not found" });
    }

    res
      .status(200)
      .json({ msg: "Product updated successfully", updatedProduct });
  } catch {
    res
      .status(500)
      .json({ msg: "An error occurred while updating the product" });
  }
}

module.exports = {
  uploadProducts,
  getProduct,
  getProductsByUser,
  getProductById,
  deleteProduct,
  updateProduct,
};
