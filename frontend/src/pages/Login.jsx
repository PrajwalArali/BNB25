import React, { useState } from "react";
import axios from "axios";
import "./Login.css";

function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleLogin = async () => {
    try {
      const res = await axios.post("http://localhost:5000/login", { email, password });
      setMessage(res.data.message);
      localStorage.setItem("token", res.data.token); // store JWT
    } catch (err) {
      setMessage(err.response?.data?.error || "Login failed");
    }
  };

  const handleSignup = async () => {
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    try {
      const res = await axios.post("http://localhost:5000/register", {
        username,
        email,
        password,
      });
      setMessage(res.data.message);
    } catch (err) {
      setMessage(err.response?.data?.error || "Signup failed");
    }
  };

  return (
    <div className="container">
      <div className="form-container">
        <div className="form-toggle">
          <button className={isLogin ? "active" : ""} onClick={() => setIsLogin(true)}>
            Login
          </button>
          <button className={!isLogin ? "active" : ""} onClick={() => setIsLogin(false)}>
            Signup
          </button>
        </div>

        {isLogin ? (
          <div className="form">
            <h2>Login</h2>
            <input type="email" placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)} />
            <button onClick={handleLogin}>Login</button>
          </div>
        ) : (
          <div className="form">
            <h2>Signup</h2>
            <input type="text" placeholder="Username"
              value={username} onChange={(e) => setUsername(e.target.value)} />
            <input type="email" placeholder="Email"
              value={email} onChange={(e) => setEmail(e.target.value)} />
            <input type="password" placeholder="Password"
              value={password} onChange={(e) => setPassword(e.target.value)} />
            <input type="password" placeholder="Confirm Password"
              value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
            <button onClick={handleSignup}>Signup</button>
          </div>
        )}

        {message && <p style={{ marginTop: "10px" }}>{message}</p>}
      </div>
    </div>
  );
}

export default Login;
