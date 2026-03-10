import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const socket = io("https://delulu-billing-pos-system.onrender.com");


function Dashboard() {

  const navigate = useNavigate();
  const [data, setData] = useState({
    total_revenue: 0,
    total_invoices: 0,
    total_products: 0,
    low_stock_products: 0
  });

  const [displayRevenue, setDisplayRevenue] = useState(0);
  const revenueRef = useRef(0);

  const [monthlyRevenue, setMonthlyRevenue] = useState(new Array(12).fill(0));
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // ===============================
  // REVENUE ANIMATION FUNCTION
  // ===============================
  const animateRevenue = (newValue) => {

    const start = revenueRef.current;
    const duration = 800;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const value = Math.floor(
        start + (newValue - start) * progress
      );
      setDisplayRevenue(value);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        revenueRef.current = newValue;
      }
    };

    requestAnimationFrame(animate);
  };

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        "https://delulu-billing-pos-system.onrender.com/admin/dashboard",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      console.log(response.data);  // 👈 ADD THIS

      setData(response.data);

      revenueRef.current = response.data.total_revenue;
      setDisplayRevenue(response.data.total_revenue);

      if (response.data.monthly_revenue)
        setMonthlyRevenue(response.data.monthly_revenue);

      if (response.data.recent_invoices)
        setRecentInvoices(response.data.recent_invoices);

      setError("");
    } catch (error) {
      setError("Access denied admin use only");
    } finally {
      setLoading(false);
    }
  };

  const addNotification = (message, type = "info") => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);

    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  useEffect(() => {

  const token = localStorage.getItem("token");

  if (!token) {
    navigate("/login");
    return;
    
  }

    fetchDashboard();

    socket.on("invoiceCreated", (newInvoice) => {

      const amount = Number(newInvoice.total);
      const newTotal = revenueRef.current + amount;

      setData(prev => ({
        ...prev,
        total_revenue: newTotal,
        total_invoices: prev.total_invoices + 1
      }));

      animateRevenue(newTotal);

      setRecentInvoices(prev => [
        {
          invoice_number: newInvoice.invoice_number,
          customer_name: "Walk-in Customer",
          amount: amount,
          date: newInvoice.created_at || new Date().toISOString(),
          status: "Paid"
        },
        ...prev
      ]);

      const currentMonth = new Date().getMonth();
      setMonthlyRevenue(prev => {
        const updated = [...prev];
        updated[currentMonth] =
          (updated[currentMonth] || 0) + amount;
        return updated;
      });

      addNotification(
        `New Invoice Created: ${newInvoice.invoice_number}`,
        "success"
      );
    });

    socket.on("lowStockAlert", (data) => {
      addNotification(
        `Low Stock Alert: ${data.product}`,
        "warning"
      );
    });

    return () => {
      socket.off("invoiceCreated");
      socket.off("lowStockAlert");
    };

  }, [navigate]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat("en-IN").format(amount);

if (loading) {
  return (
    <div style={loaderStyle}>
      <div style={spinnerStyle}></div>
      <h2>Loading Dashboard...</h2>
    </div>
  );
}

const chartData = {
  labels: [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ],
  datasets: [
    {
      label: "Monthly Revenue (₹)",
      data: monthlyRevenue,
      backgroundColor: "rgba(75,192,192,0.6)",
      borderRadius: 6
    }
  ]
};

return (
  <div style={containerStyle}>

    {/* ================= Notifications ================= */}
    <div style={notificationContainerStyle}>
      {notifications.map((note) => (
        <div
          key={note.id}
          style={{
            ...notificationStyle,
            backgroundColor:
              note.type === "success"
                ? "#4CAF50"
                : note.type === "warning"
                ? "#ff9800"
                : "#2196F3"
          }}
        >
          {note.message}
        </div>
      ))}
    </div>

    <h1 style={titleStyle}>DELULU ADMIN DASHBOARD</h1>

    {error && <div style={errorStyle}>{error}</div>}

    {/* ================= Stats Cards ================= */}
    <div style={gridStyle}>
      <div style={cardStyle}>
        <h2>Total Revenue</h2>
        <h1>₹{formatCurrency(displayRevenue)}</h1>
      </div>

      <div style={cardStyle}>
        <h2>Total Invoices</h2>
        <h1>{data.total_invoices}</h1>
      </div>

      <div style={cardStyle}>
        <h2>Total Products</h2>
        <h1>{data.total_products}</h1>
      </div>

      <div style={cardStyle}>
        <h2>Low Stock Items</h2>
        <h1
          style={{
            color: data.low_stock_products > 0 ? "#ff4d4d" : "white"
          }}
        >
          {data.low_stock_products}
        </h1>
      </div>
    </div>

    {/* ================= Chart ================= */}
    <div style={chartContainerStyle}>
      <Bar data={chartData} />
    </div>

    {/* ================= Recent Invoices ================= */}
    <div style={tableContainerStyle}>
      <h2 style={{ marginBottom: "20px" }}>Recent Invoices</h2>

      <div style={{ overflowX: "auto" }}>
        <table style={tableStyle}>
  <thead>
    <tr>
      <th style={tableHeaderStyle}>Invoice #</th>
      <th style={tableHeaderStyle}>Customer</th>
      <th style={tableHeaderStyle}>Amount</th>
      <th style={tableHeaderStyle}>Date</th>
      <th style={tableHeaderStyle}>Status</th>
    </tr>
  </thead>

  <tbody>
    {recentInvoices && recentInvoices.length > 0 ? (
      recentInvoices.map((invoice, index) => (
        <tr key={index} style={tableRowStyle}>
          <td style={tableCellStyle}>{invoice.invoice_number}</td>
          <td style={tableCellStyle}>{invoice.customer_name}</td>
          <td style={tableCellStyle}>
            ₹{formatCurrency(invoice.amount)}
          </td>
          <td style={tableCellStyle}>
            {new Date(invoice.date).toLocaleString("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
})}
          </td>
          <td style={tableCellStyle}>
            <span
              style={{
                color:
                  invoice.status === "Paid"
                    ? "#4CAF50"
                    : "#ff9800",
                fontWeight: "bold"
              }}
            >
              {invoice.status}
            </span>
          </td>
        </tr>
      ))
    ) : (
      <tr>
        <td
          colSpan="5"
          style={{
            textAlign: "center",
            padding: "20px",
            opacity: 0.7
          }}
        >
          No recent invoices found
        </td>
      </tr>
    )}
  </tbody>
</table>
      </div>
    </div>

  </div>
);
}

/* ===============================
   STYLES
================================= */

const containerStyle = {
  minHeight: "100vh",
  padding: "50px",
  fontFamily: "Segoe UI, sans-serif",
  background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
  paddingTop: "140px",
  color: "#fff"
};

const titleStyle = {
  textAlign: "center",
  marginBottom: "50px",
  fontSize: "32px",
  fontWeight: "900",
  letterSpacing: "3px",
  textTransform: "uppercase",
  background: "linear-gradient(90deg, #00f5ff, #ff00cc, #00f5ff)",
  backgroundSize: "300%",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  textShadow: "0 0 20px rgba(0,255,255,0.6)"
};

const gridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
  gap: "25px",
  marginBottom: "50px"
};

const cardStyle = {
  padding: "30px",
  borderRadius: "20px",
  background: "rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: "0 25px 45px rgba(0, 0, 0, 0.4)",
  textAlign: "center",
  transition: "transform 0.3s ease"
};

const chartContainerStyle = {
  marginTop: "50px",
  padding: "40px",
  borderRadius: "20px",
  background: "rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: "0 25px 45px rgba(0, 0, 0, 0.4)"
};

const tableContainerStyle = {
  marginTop: "50px",
  padding: "40px",
  borderRadius: "20px",
  background: "rgba(255, 255, 255, 0.08)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255, 255, 255, 0.2)",
  boxShadow: "0 25px 45px rgba(0, 0, 0, 0.4)"
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  textAlign: "left"
};
const tableHeaderStyle = {
  padding: "14px 16px",
  borderBottom: "2px solid rgba(255,255,255,0.2)",
  fontWeight: "600",
  fontSize: "15px"
};

const tableCellStyle = {
  padding: "14px 16px",
  borderBottom: "1px solid rgba(255,255,255,0.08)",
  fontSize: "14px"
};

const tableRowStyle = {
  transition: "background 0.2s ease"
};

const errorStyle = {
  textAlign: "center",
  marginBottom: "20px",
  padding: "10px",
  background: "rgba(255,0,0,0.2)",
  borderRadius: "8px"
};

const loaderStyle = {
  height: "100vh",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  alignItems: "center",
  background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
  color: "white"
};

const spinnerStyle = {
  width: "50px",
  height: "50px",
  border: "5px solid rgba(255,255,255,0.2)",
  borderTop: "5px solid white",
  borderRadius: "50%",
  animation: "spin 1s linear infinite",
  marginBottom: "20px"
};

const notificationContainerStyle = {
  position: "fixed",
  top: "20px",
  right: "20px",
  display: "flex",
  flexDirection: "column",
  gap: "10px",
  zIndex: 9999
};

const notificationStyle = {
  padding: "12px 18px",
  borderRadius: "8px",
  color: "white",
  fontWeight: "bold",
  boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
  animation: "fadeIn 0.3s ease"
};
const styleSheet = document.styleSheets[0];

styleSheet.insertRule(`
@keyframes glowMove {
  0% { background-position: 0% }
  100% { background-position: 300% }
}
`, styleSheet.cssRules.length);
export default Dashboard;