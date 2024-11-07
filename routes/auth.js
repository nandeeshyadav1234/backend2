const express = require('express');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const router = express.Router();
require('../config/passport')(passport);
const User = require('../models').User;
const Role = require('../models').Role;

router.post('/signup', function (req, res) {
    if (!req.body.email || !req.body.password || !req.body.fullname) {
        res.status(400).send({
            msg: 'Please pass username, password and name.'
        })
    } else {
        Role.findOne({
            where: {
                role_name: 'admin'
            }
        }).then((role) => {
            console.log(role.id);
            User
            .create({
                email: req.body.email,
                password: req.body.password,
                fullname: req.body.fullname,
                phone: req.body.phone,
                role_id: role.id
            })
            .then((user) => res.status(201).send(user))
            .catch((error) => {
                res.status(400).send(error);
            });
        }).catch((error) => {
            res.status(400).send(error);
        });
    }
});

router.post('/signin', async (req, res) => {
    try {
        const user = await User.findOne({
            attributes: ['email', 'password', 'fullname', 'phone', 'role_id'],
            where: { email: req.body.email }
        });

        if (!user) {
            return res.status(401).json({
                success: false,
                msg: 'Authentication failed. User not found.'
            });
        }

        const isMatch = await user.comparePassword(req.body.password);

        if (!isMatch) {
            return res.status(401).json({
                success: false,
                msg: 'Authentication failed. Wrong password.'
            });
        }

        const token = jwt.sign(JSON.parse(JSON.stringify(user)), 'nodeauthsecret', { expiresIn: '10h' });

        const role = await Role.findOne({ where: { id: user.role_id } });

        return res.json({
            success: true,
            token: 'JWT ' + token,
            user: {
                email: user.email,
                fullname: user.fullname,
                phone: user.phone,
                role_name: role?.role_name || 'No role assigned'
            }
        });
        
    } catch (error) {
        console.error('Sign-in error:', error);
        return res.status(500).json({
            success: false,
            msg: 'An error occurred during authentication.'
        });
    }
});


module.exports = router;