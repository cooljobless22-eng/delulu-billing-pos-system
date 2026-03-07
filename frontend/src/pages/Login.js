import { useState, useEffect } from "react";
import axios from "axios";

function Login() {

  const fullTitle = "DELULU MALL";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pulse, setPulse] = useState(false);
  const [displayText, setDisplayText] = useState("");

  // 🔥 Neon Pulse
  useEffect(() => {
    const interval = setInterval(() => {
      setPulse(prev => !prev);
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // ✨ Typing Animation
  useEffect(() => {
    let index = 0;
    const typing = setInterval(() => {
      setDisplayText(fullTitle.substring(0, index + 1));
      index++;
      if (index === fullTitle.length) clearInterval(typing);
    }, 80);
    return () => clearInterval(typing);
  }, []);

  const handleLogin = async () => {
    if (!username || !password) {
      alert("Please enter username and password");
      return;
    }

    try {
      setLoading(true);

      const res = await axios.post("http://localhost:5000/login", {
        username,
        password
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("username", res.data.username);
      alert("Login Successful");
      window.location.href = "/dashboard";

    } catch (error) {
      if (error.response && error.response.data.message) {
        alert(error.response.data.message);
      } else {
        alert("Login Failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.pageContainer}>

      {/* ✅ FORM ADDED FOR ENTER KEY SUPPORT */}
      <form
        style={styles.glassCard}
        onSubmit={(e) => {
          e.preventDefault();
          handleLogin();
        }}
      >

        {/* 🔥 LOGO SECTION FIXED */}
        <div style={styles.logoWrapper}>
          <div style={styles.logoGlow}></div>
          <img 
            src="/delulu-logo.png" 
            alt="Delulu Logo" 
            style={styles.logo}
          />
        </div>

        <h1 style={styles.title}>
          {displayText}
          <span style={styles.cursor}>|</span>
        </h1>

        <p style={styles.subtitle}>Welcome Back 👋</p>

        {/* Username */}
        <div style={styles.inputGroup}>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
            required
          />
          <label
            style={{
              ...styles.label,
              top: username ? "-18px" : "14px",
              fontSize: username ? "11px" : "14px",
              background: username ? "rgba(255,255,255,0.08)" : "transparent",
              padding: username ? "0 8px" : "0",
              borderRadius: username ? "6px" : "0",
              color: username ? "#00f5ff" : "#ccc"
            }}
          >
            Username
          </label>
        </div>

        {/* Password */}
        <div style={styles.inputGroup}>
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
            required
          />
          <label
            style={{
              ...styles.label,
              top: password ? "-18px" : "14px",
              fontSize: password ? "11px" : "14px",
              background: password ? "rgba(255,255,255,0.08)" : "transparent",
              padding: password ? "0 8px" : "0",
              borderRadius: password ? "6px" : "0",
              color: password ? "#00f5ff" : "#ccc"
            }}
          >
            Password
          </label>

          <span
            onClick={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            {showPassword ? "🙈" : "👁️"}
          </span>
        </div>

        {/* Button */}
        <button
          type="submit"   // ✅ Important for Enter key
          disabled={loading}
          style={{
            ...styles.button,
            boxShadow: pulse
              ? "0 0 20px #00f5ff, 0 0 40px #ff00cc"
              : "0 0 8px #00f5ff",
            transform: pulse ? "scale(1.05)" : "scale(1)"
          }}
        >
          {loading ? "Logging in..." : "Login"}
        </button>

      </form>
    </div>
  );
}

/* 💎 ULTRA GLASS STYLE */
const styles = {
  pageContainer: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
    fontFamily: "monospace"
  },

  glassCard: {
    width: "400px",
    padding: "50px",
    borderRadius: "20px",
    background: "rgba(255, 255, 255, 0.08)",
    backdropFilter: "blur(18px)",
    WebkitBackdropFilter: "blur(18px)",
    border: "1px solid rgba(255, 255, 255, 0.2)",
    boxShadow: "0 25px 45px rgba(0, 0, 0, 0.4)",
    textAlign: "center",
    color: "#fff"
  },

  logoWrapper: {
    position: "relative",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: "20px"
  },

  logoGlow: {
    position: "absolute",
    width: "200px",
    height: "200px",
    background: "radial-gradient(circle, rgba(0,255,255,0.4), transparent 70%)",
    filter: "blur(30px)"
  },

  logo: {
    width: "170px",
    borderRadius: "20px",
    zIndex: 1
  },

  title: {
    fontSize: "28px",
    fontWeight: "900",
    letterSpacing: "3px",
    textTransform: "uppercase",
    marginBottom: "10px",
    background: "linear-gradient(90deg, #00f5ff, #ff00cc, #00f5ff)",
    backgroundSize: "300%",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    textShadow: "0 0 20px rgba(0,255,255,0.6)"
  },

  cursor: {
    color: "#00f5ff",
    marginLeft: "5px"
  },

  subtitle: {
    marginBottom: "30px",
    color: "#ddd",
    fontSize: "14px"
  },

  inputGroup: {
    position: "relative",
    marginBottom: "25px"
  },

  input: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "1px solid rgba(255,255,255,0.3)",
    fontSize: "14px",
    outline: "none",
    background: "rgba(255,255,255,0.1)",
    color: "#fff"
  },

  label: {
    position: "absolute",
    left: "12px",
    transition: "all 0.3s ease",
    pointerEvents: "none"
  },

  eyeIcon: {
    position: "absolute",
    right: "12px",
    top: "50%",
    transform: "translateY(-50%)",
    cursor: "pointer",
    fontSize: "18px"
  },

  button: {
    width: "100%",
    padding: "12px",
    borderRadius: "8px",
    border: "none",
    background: "linear-gradient(90deg, #00f5ff, #ff00cc)",
    color: "#fff",
    fontSize: "16px",
    fontWeight: "bold",
    transition: "all 0.4s ease"
  }
};

export default Login;