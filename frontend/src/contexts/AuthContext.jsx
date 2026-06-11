import { createContext, useState, useContext }from "react";
import  axios from "axios";
import httpStatus from "http-status-codes";
import { useNavigate } from "react-router-dom";


export const AuthContext = createContext({});

const client = axios.create({
    baseURL: "http://localhost:5000/api/v1/users",
});

export const AuthProvider = ({ children }) => {

    // const authContext = useContext(authContext);

    const [userData, setUserData] = useState({});

    const router = useNavigate();

    const handleRegister = async (username, email, password) => {
        try {
            let request = await client.post("/register", {
                username: username,
                email: email,
                password: password,
            })
            if(request.status === httpStatus.CREATED) {
                return request.data.message;
            }
        } catch (error) {
            throw error.response.data.message;
        }
    }

    const handleLogin = async (username, password) => {
        try {
            let request = await client.post("/login", {
                username: username,
                password: password,
            });
            if(request.status === httpStatus.OK) {
                localStorage.setItem("token", request.data.token);
                router("/home");
            }
        } catch (error) {
            throw error.response.data.message;
        }
    };

    const data = {
        userData, setUserData, handleRegister, handleLogin
    }

    return (
        <AuthContext.Provider value={data}>
            {children}
        </AuthContext.Provider>
    )

}