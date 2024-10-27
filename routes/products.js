const express = require('express');
const router = express.Router();
const Product = require('../models').Product;
const Properties = require('../models').Properties;
const Land = require('../models').Land;
const passport = require('passport');
require('../config/passport')(passport);
const Helper = require('../utils/helper');
const helper = new Helper();

// Create a new Product
router.post('/', passport.authenticate('jwt', {
    session: false
}), function (req, res) {
    helper.checkPermission(req.user.role_id, 'product_add').then((rolePerm) => {
        if (!req.body.prod_name || !req.body.prod_description || !req.body.prod_image || !req.body.prod_price) {
            res.status(400).send({
                msg: 'Please pass Product name, description, image or price.'
            })
        } else {
            Product
                .create({
                    prod_name: req.body.prod_name,
                    prod_description: req.body.prod_description,
                    prod_image: req.body.prod_image,
                    prod_price: req.body.prod_price
                })
                .then((product) => res.status(201).send(product))
                .catch((error) => {
                    console.log(error);
                    res.status(400).send(error);
                });
        }
    }).catch((error) => {
        res.status(403).send(error);
    });
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
            'images', 
            'availability', 
            'contactNo', 
            'contatctEmail'
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
              'nearestBusStop'
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