const express = require('express');
const router = express.Router();
const Product = require('../models').Product;
const Properties = require('../models').Properties;
const Land = require('../models').Land;
const User = require('../models').User;
const passport = require('passport');
require('../config/passport')(passport);
const Helper = require('../utils/helper');
const helper = new Helper();
const jwt = require('jsonwebtoken');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: './uploads',  // Make sure the 'uploads' folder exists
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});
  
  const upload = multer({ storage });
  
  router.post('/upload', upload.array('images', 10), (req, res) => {
    try {
      if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
      }
  
      // Map over the files array and generate URLs for each file
      const imageUrls = req.files.map((file) => `/uploads/${file.filename}`);
  
      res.status(200).json({
        message: 'Images uploaded successfully!',
        imageUrls, // Array of URLs for the uploaded images
      });
    } catch (error) {
      console.error('Error handling image upload:', error);
      res.status(500).json({ message: 'Image upload failed' });
    }
  });
// Create a new Product
router.post('/', async (req, res) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Get token from "Bearer <token>"

  if (!token) {
    return res.status(401).send({ msg: 'Token missing or invalid' });
  }
    try {
  
      // Basic request validation
      const { name, description, amount, type, city, postalCode, availability, electricity, tapWater, size, nearestSchool, nearestBus, nearestHospital, nearestRailway, images } = req.body;
      if (!name || !description || !amount) {
        return res.status(400).send({
          msg: 'Please provide all required fields: Product name, description, image, and price.'
        });
      }
      const userDetails = jwt.verify(authHeader.split(' ')[2], 'nodeauthsecret');
      console.log('userDetails', userDetails);
      // Create product
      const property = await Properties.create({
        name,
        description,
        amount,
        user_id:userDetails.id,
        type,
        city,
        postalCode,
        availability,
        images
      });
      const land = await Land.create({
        electricity,
        tapwater:tapWater,
        size,
        property_id:property.id,
        nearestSchool,
        nearestBusStop:nearestBus,
        nearestRailway,
        nearestHospital
      });
      // Send success response
      res.status(201).send(property);
  
    } catch (error) {
      if (error.name === 'PermissionError') {
        res.status(403).send({ msg: 'You do not have permission to add products.' });
      } else {
        console.error(error);
        res.status(500).send({ msg: 'An error occurred while creating the product.' });
      }
    }
  });

// Get List of Products
router.get('/', function (req, res) {
    Properties.findAll({
        attributes: [
            'id', 
            'name', 
            'description', 
            'amount', 
            'city', 
            'postalCode', 
            'description', 
            'user_id',
            'type',
            'images', 
            'availability'
        ], // Columns from Properties
        include: [
          {
            model: Land,
            as: 'landDetails', // Alias used in the association
            attributes: [
              'electricity',
              'tapwater',
              'size',
              'nearestSchool',
              'nearestRailway',
              'nearestBusStop',
              'nearestHospital',
              'negotiable'
            ], // Columns from Land
            required: false, // Left join (include rows from Properties even if no matching Land entry exists)
          },
          {
            model: User,
            as: 'userDetails', // Alias used in the association
            attributes: [
              'fullname',
              'id',
              'email'
            ], // Columns from Land
            required: false, // Left join (include rows from Properties even if no matching Land entry exists)
          },
        ],
      })
      .then((products) => res.status(200).send(products))
      .catch((error) => {
        res.status(400).send(error);
    });
});

// Get Product by ID
router.get('/:id', function (req, res) {
    Properties
        .findByPk(req.params.id, {
            attributes: [
                'id', 
                'name', 
                'description', 
                'amount', 
                'city', 
                'postalCode', 
                'description', 
                'images', 
                'availability', 
                'contactNo', 
                'contatctEmail'
            ], // Columns from Properties
            include: [
                {
                    model: Land,
                    as: 'landDetails', // Ensure this matches the alias used in the Properties model
                    attributes: [
                        'electricity',
                        'tapwater',
                        'size',
                        'nearestSchool',
                        'nearestRailway',
                        'nearestBusStop',
                    ],
                },
            ],
        })
        .then((product) => {
            if (!product) {
                return res.status(404).send({ message: 'Property not found' });
            }
            res.status(200).send(product);
        })
        .catch((error) => {
            console.error('Error fetching property:', error);
            res.status(400).send(error);
        });
});

// Update a Product
router.put('/:id', passport.authenticate('jwt', {
    session: false
}), function (req, res) {
    helper.checkPermission(req.user.role_id, 'product_update').then((rolePerm) => {
        if (!req.body.prod_name || !req.body.prod_description || !req.body.prod_image || !req.body.prod_price) {
            res.status(400).send({
                msg: 'Please pass Product name, description, image or price.'
            })
        } else {
            Product
                .findByPk(req.params.id)
                .then((product) => {
                    Product.update({
                        prod_name: req.body.prod_name || user.prod_name,
                        prod_description: req.body.prod_description || user.prod_description,
                        prod_image: req.body.prod_image || user.prod_image,
                        prod_price: req.body.prod_price || user.prod_price
                    }, {
                        where: {
                            id: req.params.id
                        }
                    }).then(_ => {
                        res.status(200).send({
                            'message': 'Product updated'
                        });
                    }).catch(err => res.status(400).send(err));
                })
                .catch((error) => {
                    res.status(400).send(error);
                });
        }
    }).catch((error) => {
        res.status(403).send(error);
    });
});

// Delete a Product
router.delete('/:id', passport.authenticate('jwt', {
    session: false
}), function (req, res) {
    helper.checkPermission(req.user.role_id, 'product_delete').then((rolePerm) => {
        if (!req.params.id) {
            res.status(400).send({
                msg: 'Please pass product ID.'
            })
        } else {
            Product
                .findByPk(req.params.id)
                .then((product) => {
                    if (product) {
                        Product.destroy({
                            where: {
                                id: req.params.id
                            }
                        }).then(_ => {
                            res.status(200).send({
                                'message': 'Product deleted'
                            });
                        }).catch(err => res.status(400).send(err));
                    } else {
                        res.status(404).send({
                            'message': 'Product not found'
                        });
                    }
                })
                .catch((error) => {
                    res.status(400).send(error);
                });
        }
    }).catch((error) => {
        res.status(403).send(error);
    });
});
router.get('/productList', function (req, res) {
    res.status(200).send({
        'message': 'Product not found'
    });
  });
module.exports = router;