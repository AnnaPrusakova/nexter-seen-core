import { Request, Response } from 'express';

import { User, validate } from '../models/user';

import { decrypt, encrypt } from '../utils/confirmation';

import { google } from 'googleapis';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

import nodemailer from 'nodemailer';

const { OAuth2 } = google.auth;

const { OAUTH_REFRESH_TOKEN } = process.env;
const { OAUTH_CLIENT_SECRET } = process.env;
const { OAUTH_CLIENT_ID } = process.env;
const createTransporter = async () => {
	const oauth2Client = new OAuth2(
		`${OAUTH_CLIENT_ID}`,
		`${OAUTH_CLIENT_SECRET}`,
		'https://developers.google.com/oauthplayground'
	);

	oauth2Client.setCredentials({
		refresh_token: `${OAUTH_REFRESH_TOKEN}`
	});

	const accessToken = await new Promise((resolve, reject) => {
		oauth2Client.getAccessToken(
			(err: any, token: string | null | undefined) => {
				if (err) {
					reject();
				}
				resolve(token);
			}
		);
	});

	return nodemailer.createTransport({
		service: 'gmail',
		auth: {
			type: 'OAuth2',
			user: 'nexterseen@gmail.com',
			accessToken: accessToken || '',
			clientId: `${OAUTH_CLIENT_ID}`,
			clientSecret: `${OAUTH_CLIENT_SECRET}`,
			refreshToken: `${OAUTH_REFRESH_TOKEN}`
		}
	} as nodemailer.TransportOptions);
};

const sendEmail = async ({
	email,
	username,
	res
}: {
	email: string;
	username: string;
	res: Response;
}) => {
	// Create a unique confirmation token
	const confirmationToken = encrypt(username);
	const apiUrl = process.env.API_URL || 'http://0.0.0.0:4000';

	// Initialize the Nodemailer with your Gmail credentials
	const Transport = await createTransporter();

	// Configure the email options
	const mailOptions = {
		from: 'Educative Fullstack Course',
		to: email,
		subject: 'Email Confirmation',
		html: `Press the following link to verify your email:
 <a href=${apiUrl}/verify/${confirmationToken}>Verification Link</a>`
	};

	// Send the email
	Transport.sendMail(mailOptions, (error: any, _: any) => {
		if (error) {
			res.status(400).send(error);
		} else {
			res.status(201).json({
				message: 'Account created successfully, please verify your email.'
			});
		}
	});
};

const verifyEmail = async (req: Request, res: Response) => {
	try {
		// Get the confirmation token
		const { confirmationToken } = req.params;

		// Decrypt the username
		const username = decrypt(confirmationToken);

		// Check if there is anyone with that username
		const user = await User.findOne({ username });

		if (user) {
			// If there is anyone, mark them as confirmed account
			user.isConfirmed = true;
			await user.save();

			// Return the created user data
			res
				.status(201)
				.json({ message: 'User verified successfully', data: user });
		} else {
			return res.status(409).send('User Not Found');
		}
	} catch (err) {
		console.error(err);
		return res.status(400).send(err);
	}
};

const signup = async (req: Request, res: Response) => {
	try {
		const { error } = validate(req.body);
		if (error) return res.status(400).send(error.details[0].message);

		const { firstName, lastName, username, email, password } = req.body;

		const emailExists = await User.findOne({ email, username });
		console.log('email', emailExists);
		const usernameExists = await User.findOne({ username });
		if (emailExists) {
			return res.status(409).send('Email Already Exist. Please Login');
		}
		if (usernameExists) {
			return res.status(409).send('Username Already Exist. Please Login');
		}

		const salt = await bcrypt.genSalt(Number(process.env.SALT));
		const hashedPassword = await bcrypt.hash(password, salt);

		const user = await User.create({
			firstName,
			lastName,
			username,
			email: email.toLowerCase(),
			password: hashedPassword
		});

		user.token = jwt.sign(
			{ userId: user._id, email },
			process.env.TOKEN_SECRET_KEY ? process.env.TOKEN_SECRET_KEY : '',
			{
				expiresIn: '2h'
			}
		);

		return sendEmail({ email, username, res });
	} catch (err) {
		console.error(err);
	}
};
export { verifyEmail, signup };
