import jwt from "jsonwebtoken";

const SECRETKEY = "sdfksdkl;fdsfm;sdf"; 

export const createToken = (id) => {
  const token = jwt.sign({ id }, SECRETKEY, { expiresIn: "90d" });
  return token;
};

export const TokenVerify=(token)=>{
    const id = jwt.verify(token,SECRETKEY);
    return id.id
}