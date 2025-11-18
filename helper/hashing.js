import bcrypt from "bcrypt";

// Hash password
export const hashedpassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  const hashpassword = await bcrypt.hash(password, salt);
  return hashpassword;
};

// Compare password
export const compairPassword = async (planepassword, hashpass) => {
  const checkpass = await bcrypt.compare(planepassword, hashpass);
  return checkpass;
};
