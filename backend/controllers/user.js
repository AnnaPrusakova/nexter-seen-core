const { User, validate} = require('../models/user');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

exports.signup = async (req, res) => {
    try {
        const { error } = validate(req.body);
        if (error) return res.status(400).send(error.details[0].message);

        const {firstName, lastName, username, email, password} = req.body;

        const oldUser = await User.findOne({email});
        if (oldUser) {
            res.status(409).send("User Already Exist. Please Login");
        }

        const salt = await bcrypt.genSalt(Number(process.env.SALT));
        const hashedPassword = await bcrypt.hash(password, salt);

        let user = await User.create({
            firstName,
            lastName,
            username,
            email: email.toLowerCase(),
            password: hashedPassword
        });

        const token = jwt.sign(
            {userId: user._id, email},
            process.env.TOKEN_SECRET_KEY,
            {
                expiresIn: "2h"
            }
        );
        user.token = token;
        res.status(201).json(user);
    } catch (err) {
        console.error(err);
    }
};
