import { User } from "../models/users.model.js";
import httpStatus from "http-status";
import crypto from "crypto";
import bcrypt, { hash } from "bcrypt";

const login = async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(httpStatus.BAD_REQUEST)
      .json({ message: "Username and password are required !" });
  }

  try {
    const user = await User.findOne({ username });

    if (!user) {
      return res
        .status(httpStatus.NOT_FOUND)
        .json({ message: "User not found !" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res
        .status(httpStatus.UNAUTHORIZED)
        .json({ message: "Invalid password !" });
    }

    if (isPasswordValid) {
      let token = crypto.randomBytes(20).toString("hex"); // Generate a random token for the user and convert it to a hexadecimal string
      user.token = token; // Store the generated token in the user's document in the database and localstorage on the client side for future authentication and authorization purposes
      await user.save(); // Save the updated user document to the database

      res.status(httpStatus.OK).json({ message: "Login successful !" });
    }
  } catch {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong during login !" });
  }
};

const register = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res
        .status(httpStatus.FOUND)
        .json({ message: "User already exists !" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      username: username,
      email,
      password: hashedPassword,
    });

    await newUser.save();
    res
      .status(httpStatus.CREATED)
      .json({ message: "User registered successfully !" });
  } catch (error) {
        return 
            res.status(httpStatus.INTERNAL_SERVER_ERROR).json({ message: "Something went wrong during registration !" });
        console.error("Error during registration:", error)
        
  }
};

const getUserHistory = async (req, res) => {
  const { token } = req.query;

  if(!token) {
    return res.status(httpStatus.BAD_REQUEST).json({ message: "Credentials are required !" });
  }

    try {
        const users = await User.find({token : token});
        const meetings = await Meeting.find({user_id : user.username});
        res.status(httpStatus.OK).json({ meetings: meetings });
    } catch (error) {
        return res
            .status(httpStatus.INTERNAL_SERVER_ERROR)
            .json({ message: "Something went wrong while fetching activity !" });
    }
};


const addToHistory = async (req, res) => {
  const {token, meeting_code} = req.body;

  try {
    const user = await User.findOne({ token: token });

    const newMeting = new Meeting({
      user_id: user.username,
      meeting_code: meeting_code,
    });
    await newMeting.save();
    res.status(httpStatus.OK).json({ message: "Meeting added successfully !" });
  } catch (error) {
    return res
      .status(httpStatus.INTERNAL_SERVER_ERROR)
      .json({ message: "Something went wrong while adding meeting !" });
  }
};

export { login, register, getUserHistory, addToHistory };