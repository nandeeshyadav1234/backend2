const express = require('express');
const router = express.Router();
const User = require('../models').User;
const Role = require('../models').Role;
const Permission = require('../models').Permission;
const passport = require('passport');
require('../config/passport')(passport);
const Helper = require('../utils/helper');
const helper = new Helper();

// Create a new User
router.post('/', passport.authenticate('jwt', {
  session: false
}), function (req, res) {
  helper.checkPermission(req.user.role_id, 'user_add').then((rolePerm) => {
    if (!req.body.role_id || !req.body.email || !req.body.password || !req.body.fullname || !req.body.phone) {
      res.status(400).send({
        msg: 'Please pass Role ID, email, password, phone or fullname.'
      })
    } else {
      User
        .create({
          email: req.body.email,
          password: req.body.password,
          fullname: req.body.fullname,
          phone: req.body.phone,
          role_id: req.body.role_id
        })
        .then((user) => res.status(201).send(user))
        .catch((error) => {
          console.log(error);
          res.status(400).send(error);
        });
    }
  }).catch((error) => {
    res.status(403).send(error);
  });
});

router.post('/addUser', async (req, res) => {
  const {
    fullname,
    email,
    phone,
    password,
    avatar = 'default.jpg',
    description,
    address,
    city,
    gender,
    birthday,
    role, // Role parameter to determine role_id
  } = req.body;

  try {
    // Fetch role_id from Roles table based on the role name
    const roleRecord = await Role.findOne({ where: { role_name: role } });
    if (!roleRecord) {
      return res.status(404).json({ error: `Role '${role}' not found` });
    }

    // Use fetched role_id in the vendor creation
    const newVendor = await User.create({
      fullname,
      email,
      phone,
      password,
      avatar,
      description,
      address,
      city,
      role_id: roleRecord.id, // Set role_id to the ID found in Roles table
      gender,
      birthday,
    });

    res.status(201).json({
      message: 'Vendor added successfully!',
      vendor: newVendor,
    });
  } catch (error) {
    console.error('Error adding vendor:', error);
    res.status(500).json({ error: 'Failed to add vendor' });
  }
});

router.get('/', function(re, res) {
User.findAll({
  where: {
    role_id: 2
  }
}) .then((users) => res.status(201).send(users));
});
const bcrypt = require('bcryptjs');

// Update Vendor
router.put('/updateUser/:id', async (req, res) => {
  try {
    // Check if user has permission to update vendors
    // await helper.checkPermission(req.user.role_id, 'user_update');

    const vendorId = req.params.id;
    const {
      fullname,
      email,
      phone,
      password,
      avatar,
      description,
      address,
      city,
      gender,
      birthday,
    } = req.body;

    const vendor = await User.findByPk(vendorId);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    const updatedData = {
      fullname,
      email,
      phone,
      avatar,
      description,
      address,
      city,
      gender,
      birthday,
    };

    // If a new password is provided, hash it before updating
    if (password) {
      updatedData.password = await bcrypt.hash(password, 10);
    }

    await vendor.update(updatedData);

    res.status(200).json({ message: 'Vendor updated successfully', vendor });
  } catch (error) {
    console.error('Error updating vendor:', error);
    res.status(500).json({ error: 'Failed to update vendor' });
  }
});

// Delete Vendor
router.delete('/deleteUser/:id', async (req, res) => {
  try {
    // Check if user has permission to delete vendors
    // await helper.checkPermission(req.user.role_id, 'user_delete');

    const vendorId = req.params.id;
    const vendor = await User.findByPk(vendorId);

    if (!vendor) {
      return res.status(404).json({ error: 'Vendor not found' });
    }

    await vendor.destroy();

    res.status(200).json({ message: 'Vendor deleted successfully' });
  } catch (error) {
    console.error('Error deleting vendor:', error);
    res.status(500).json({ error: 'Failed to delete vendor' });
  }
});

// Get List of Users
router.get('/', passport.authenticate('jwt', {
  session: false
}), function (req, res) {
  helper.checkPermission(req.user.role_id, 'user_get_all').then((rolePerm) => {
    User
      .findAll({
        include: [
          { 
            model: Role,
            include: [
              {
                model: Permission,
                as: 'permissions'
              }
            ]
          }
        ]
      })
      .then((users) => res.status(200).send(users))
      .catch((error) => {
        res.status(400).send(error);
      });
  }).catch((error) => {
    res.status(403).send(error);
  });
});
// Get List of Vendors (role_id = 2)
router.get('/getUsers', async (req, res) => {
  try {
    // Check if user has permission to view vendors
    // await helper.checkPermission(req.user.role_id, 'user_get_all');

    // Fetch vendors with role_id = 2
    const vendors = await User.findAll({
      include: [
        {
          model: Role,
          include: [
            {
              model: Permission,
              as: 'permissions'
            }
          ]
        }
      ]
    });

    res.status(200).json(vendors);
  } catch (error) {
    console.error('Error fetching vendors:', error);
    res.status(500).json({ error: 'Failed to fetch vendors' });
  }
});

// Get User by ID
router.get('/:id', passport.authenticate('jwt', {
  session: false
}), function (req, res) {
  helper.checkPermission(req.user.role_id, 'user_get').then((rolePerm) => {
    User
      .findByPk(req.params.id)
      .then((user) => res.status(200).send(user))
      .catch((error) => {
        res.status(400).send(error);
      });
  }).catch((error) => {
    res.status(403).send(error);
  });
});

// Update a User
router.put('/:id', passport.authenticate('jwt', {
  session: false
}), function (req, res) {
  helper.checkPermission(req.user.role_id, 'role_update').then((rolePerm) => {
    if (!req.body.role_id || !req.body.email || !req.body.fullname || !req.body.phone) {
      res.status(400).send({
        msg: 'Please pass Role ID, email, password, phone or fullname.'
      })
    } else {
      User
        .findByPk(req.params.id)
        .then((user) => {
          User.update({
            email: req.body.email || user.email,
            fullname: req.body.fullname || user.fullname,
            phone: req.body.phone || user.phone,
            role_id: req.body.role_id || user.role_id
          }, {
            where: {
              id: req.params.id
            }
          }).then(_ => {
            res.status(200).send({
              'message': 'User updated'
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

// Delete a User
router.delete('/:id', passport.authenticate('jwt', {
  session: false
}), function (req, res) {
  helper.checkPermission(req.user.role_id, 'role_delete').then((rolePerm) => {
    if (!req.params.id) {
      res.status(400).send({
        msg: 'Please pass user ID.'
      })
    } else {
      User
        .findByPk(req.params.id)
        .then((user) => {
          if (user) {
            User.destroy({
              where: {
                id: req.params.id
              }
            }).then(_ => {
              res.status(200).send({
                'message': 'User deleted'
              });
            }).catch(err => res.status(400).send(err));
          } else {
            res.status(404).send({
              'message': 'User not found'
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

module.exports = router;