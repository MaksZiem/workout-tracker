const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const HttpError = require("../models/http-error");
const User = require("../models/user");
const jwt = require("jsonwebtoken");

exports.signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new HttpError("Wprowadzone dane sa niepoprawne", 422));
  }

  const { name, surname, email, password, role } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    error = new HttpError(
      "Rejestracja nie powiodła się, spróbuj ponownie później.",
      500
    );
    return next(error);
  }

  if (existingUser) {
    const error = new HttpError(
      "Uytkownik o takim emailu juz istnieje, zaloguj sie.",
      422
    );
    return next(error);
  }

  let hashPass;
  try {
    hashPass = await bcrypt.hash(password, 12);
  } catch (error) {
    error = new HttpError(
      "Nie mozna stworzyc uzytkownika z wybranym haslem",
      500
    );
    return next(error);
  }

  const createdUser = new User({
    name,
    surname,
    email,
    role,
    password: hashPass,
  });

  try {
    await createdUser.save();
  } catch (error) {
    error = new HttpError(
      "Rejestracja nie powiodła się, spróbuj ponownie później.",
      500
    );
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: createdUser.id, email: createdUser.email },
      "TOKEN_KEY",
      { expiresIn: "1h" }
    );
  } catch (error) {
    error = new HttpError(
      "Rejestracja nie powiodła się, spróbuj ponownie później.",
      500
    );
    return next(error);
  }

  res.status(201).json({
    userId: createdUser.id,
    email: createdUser.email,
    token: token,
    userRole: createdUser.role,
  });
};

exports.login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;

  try {
    existingUser = await User.findOne({ email: email });
  } catch (err) {
    const error = new HttpError(
      "Logowanie nie powiodło sie, spróbuj ponownie później.",
      500
    );
    return next(error);
  }

  if (!existingUser) {
    const error = new HttpError("Wprowadzone dane są niepoprawne.", 401);
    return next(error);
  }

  let isValidPass = false;
  try {
    isValidPass = await bcrypt.compare(password, existingUser.password);
  } catch (error) {
    error = new HttpError("Wprowadz poprawne dane");
    return next(error);
  }

  if (!isValidPass) {
    const error = new HttpError("Wprowadz poprawne dane.", 401);
    return next(error);
  }

  let token;
  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      "TOKEN_KEY",
      { expiresIn: "1h" }
    );
  } catch (error) {
    error = new HttpError(
      "Logowanie nie powiodło się, spróbuj ponownie poźniej",
      500
    );
    return next(error);
  }

  req.user = existingUser;

  res.json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
    userRole: existingUser.role,
  });
};

exports.updateUser = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid inputs passed, please check your data.", 422)
    );
  }

  const userId = req.params.userId;
  const { name, surname, email } = req.body;

  let user;
  try {
    user = await User.findById(userId);
  } catch (error) {
    error = new HttpError("Coś poszło nie tak, spróbuj ponownie później.", 500);
    return next(error);
  }

  user.name = name;
  user.surname = surname;
  user.email = email;
  user.pesel = pesel;

  try {
    await user.save();
  } catch (err) {
    const error = new HttpError(
      "Coś poszło nie tak, spróbuj ponownie później.",
      500
    );
    return next(error);
  }

  res.status(200).json({
    user: user.toObject({ gettets: true }),
    message: "Aktualizacja przebiegła pomyślnie.",
  });
};
