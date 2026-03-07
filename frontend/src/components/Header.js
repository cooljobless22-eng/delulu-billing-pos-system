import logo from "../assets/delulu-logo.png";
import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";

function Header() {
  const [username, setUsername] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const storedUser = localStorage.getItem("username");
    if (storedUser) {
      setUsername(storedUser);
    }
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm(
      "Are you sure you want to logout?"
    );

    if (!confirmLogout) return;

    localStorage.removeItem("token");
    localStorage.removeItem("username");
    navigate("/");
  };

  return (
    <>
      {/* ================= TOP HEADER ================= */}
      <div style={styles.header}>
        <div style={styles.brand}>
          <img src={logo} alt="DELULU MALL" style={styles.logo} />
          <h1 className="brand-title">DELULU MALL</h1>
        </div>

        <div style={styles.userSection}>
          <span style={styles.username}>👤 {username}</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            Logout
          </button>
        </div>
      </div>

      {/* ================= NAVBAR ================= */}
      <div style={styles.navbar}>
        {/* DASHBOARD */}
        <button
          style={{
            ...styles.navBtn,
            ...(location.pathname === "/dashboard" && styles.activeNav)
          }}
          onClick={() => navigate("/dashboard")}
        >
          Dashboard
        </button>

        {/* POS (Professional Active Logic) */}
        <button
          style={{
            ...styles.navBtn,
            ...(location.pathname.startsWith("/pos") && styles.activeNav)
          }}
          onClick={() => navigate("/pos")}
        >
          POS
        </button>

        {/* INVENTORY */}
        <button
          style={{
            ...styles.navBtn,
            ...(location.pathname === "/inventory" && styles.activeNav)
          }}
          onClick={() => navigate("/inventory")}
        >
          Inventory
        </button>
      </div>
    </>
  );
}

export default Header;

const styles = {
  header: {
    width: "100%",
    background: "#0f172a",
    padding: "10px 30px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottom: "1px solid #1e293b",
    position: "fixed",
    top: 0,
    left: 0,
    zIndex: 1000
  },

  brand: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  logo: {
    height: "70px",
    filter: "drop-shadow(0 0 20px #ff00ff)"
  },

  userSection: {
    display: "flex",
    alignItems: "center",
    gap: "10px"
  },

  username: {
    color: "#ffffff",
    fontWeight: "bold",
    fontSize: "14px"
  },

  logoutBtn: {
    background: "#ff007f",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer",
    fontWeight: "bold",
    fontSize: "13px"
  },

  navbar: {
    position: "fixed",
    top: "80px",
    width: "100%",
    background: "#1e293b",
    display: "flex",
    justifyContent: "center",
    gap: "20px",
    padding: "8px 0",
    zIndex: 999
  },

  navBtn: {
    background: "transparent",
    border: "none",
    color: "white",
    fontSize: "14px",
    fontWeight: "bold",
    cursor: "pointer",
    padding: "6px 12px",
    borderRadius: "6px",
    transition: "0.3s"
  },

  activeNav: {
    background: "#ff00ff",
    color: "white"
  }
};