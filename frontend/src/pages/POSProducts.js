import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

function POSProducts() {
  const navigate = useNavigate();

  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const searchTimeout = useRef(null);

  // ================= ADD ITEM =================
  const addItem = async () => {
    if (!barcode.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://delulu-billing-pos-system.onrender.com/api/products/${barcode.trim()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const product = response.data;
      const existingIndex = items.findIndex(
        (i) => i.barcode === product.barcode
      );

      let updatedItems = [...items];

      if (existingIndex !== -1) {
        updatedItems[existingIndex].quantity += 1;
      } else {
        updatedItems.push({
          barcode: product.barcode,
          name: product.name,
          price: parseFloat(product.price),
          quantity: 1,
          gst: parseFloat(product.gst_percentage) / 100,
        });
      }

      setItems(updatedItems);
      calculateTotal(updatedItems);
      setBarcode("");
    } catch {
      alert("Product not found in database");
    }
  };

  // ================= INCREASE =================
  const increaseQty = (index) => {
    const updated = [...items];
    updated[index].quantity += 1;
    setItems(updated);
    calculateTotal(updated);
  };

  // ================= DECREASE =================
  const decreaseQty = (index) => {
    const updated = [...items];

    if (updated[index].quantity > 1) {
      updated[index].quantity -= 1;
    } else {
      updated.splice(index, 1);
    }

    setItems(updated);
    calculateTotal(updated);
  };

  // ================= REMOVE =================
  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    calculateTotal(updated);
  };

  // ================= CALCULATE =================
  const calculateTotal = (cartItems) => {
    let sub = 0;
    let totalGST = 0;

    cartItems.forEach((item) => {
      const itemTotal = item.price * item.quantity;
      const itemGST = itemTotal * item.gst;
      sub += itemTotal;
      totalGST += itemGST;
    });

    const finalTotal = sub + totalGST;

    setSubtotal(parseFloat(sub.toFixed(2)));
    setGstAmount(parseFloat(totalGST.toFixed(2)));
    setTotalAmount(parseFloat(finalTotal.toFixed(2)));
  };

  // ================= SEARCH =================
  const searchProducts = (value) => {
    setSearchTerm(value);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length < 1) return setSuggestions([]);

    searchTimeout.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `https://delulu-billing-pos-system.onrender.com/api/products/search/${encodeURIComponent(value)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuggestions(response.data || []);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  const selectProduct = (product) => {
    const existingIndex = items.findIndex(
      (i) => i.barcode === product.barcode
    );

    let updatedItems = [...items];

    if (existingIndex !== -1) {
      updatedItems[existingIndex].quantity += 1;
    } else {
      updatedItems.push({
        barcode: product.barcode,
        name: product.name,
        price: parseFloat(product.price),
        quantity: 1,
        gst: parseFloat(product.gst_percentage) / 100,
      });
    }

    setItems(updatedItems);
    calculateTotal(updatedItems);
    setSearchTerm("");
    setSuggestions([]);
  };

  // ================= STYLES =================
  const styles = {
    pageContainer: {
      height: "100vh",
      overflow: "hidden",
      paddingTop: "120px",
      background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
      fontFamily: "Segoe UI, sans-serif",
      padding: "120px 20px 20px 20px",
      boxSizing: "border-box",
    },
    glassCard: {
      height: "calc(100vh - 160px)",
      display: "flex",
      borderRadius: "20px",
      background: "rgba(255,255,255,0.08)",
      backdropFilter: "blur(18px)",
      border: "1px solid rgba(255,255,255,0.2)",
      boxShadow: "0 25px 45px rgba(0,0,0,0.4)",
      overflow: "hidden",
    },
    leftPanel: {
      flex: 1,
      padding: "25px",
      display: "flex",
      flexDirection: "column",
      borderRight: "1px solid rgba(255,255,255,0.2)",
    },
    rightPanel: {
      flex: 1,
      padding: "25px",
      display: "flex",
      flexDirection: "column",
      overflow: "hidden",
    },
    gradientTitle: {
      fontSize: "28px",
      fontWeight: "900",
      textAlign: "center",
      marginBottom: "20px",
      background: "linear-gradient(90deg, #ff00ff, #ff69b4, #ff00ff)",
      backgroundSize: "300%",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      animation: "gradientMove 3s linear infinite",
    },
    input: {
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.3)",
      background: "rgba(255,255,255,0.1)",
      color: "#fff",
      marginBottom: "15px",
    },

    // NEW: search wrapper + floating suggestions
    searchWrapper: {
      position: "relative",
      marginBottom: "15px",
    },
    suggestionsBox: {
      position: "absolute",
      top: "50px",
      left: 0,
      right: 0,
      maxHeight: "200px",
      overflowY: "auto",
      background: "rgba(20,20,20,0.95)",
      backdropFilter: "blur(12px)",
      border: "1px solid rgba(255,255,255,0.2)",
      borderRadius: "8px",
      zIndex: 1000,
      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
    },

    button: {
      padding: "6px 10px",
      borderRadius: "6px",
      border: "none",
      background: "linear-gradient(90deg, #00f5ff, #ff00cc)",
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
    },
    smallBtn: {
      padding: "4px 8px",
      borderRadius: "6px",
      border: "none",
      background: "linear-gradient(90deg, #00f5ff, #ff00cc)",
      color: "#fff",
      cursor: "pointer",
      fontWeight: "bold",
    },
    cartContainer: {
      flex: 1,
      overflowY: "auto",
    },
    cartItem: {
      position: "relative",
      marginBottom: "8px",
      padding: "8px",
      borderRadius: "8px",
      background: "rgba(255,255,255,0.12)",
      color: "#fff",
      fontSize: "13px",
    },
    removeBtn: {
      position: "absolute",
      top: "5px",
      right: "5px",
      background: "red",
      border: "none",
      borderRadius: "50%",
      width: "22px",
      height: "22px",
      color: "#fff",
      cursor: "pointer",
      fontSize: "12px",
    },
    totalsBox: {
      marginTop: "20px",
      padding: "15px",
      borderRadius: "12px",
      background: "rgba(255,255,255,0.08)",
      border: "1px solid rgba(255,255,255,0.2)",
      color: "#fff"
    }
  };

  return (
    <div style={styles.pageContainer}>
      <style>{`
        @keyframes gradientMove {
          0% { background-position: 0% }
          50% { background-position: 100% }
          100% { background-position: 0% }
        }
      `}</style>

      <div style={styles.glassCard}>
        <div style={styles.leftPanel}>
          <h2 style={styles.gradientTitle}>DELULU POS</h2>

          {/* SEARCH WITH FLOATING SUGGESTIONS */}
          <div style={styles.searchWrapper}>
            <input
              placeholder="Search product..."
              value={searchTerm}
              onChange={(e) => searchProducts(e.target.value)}
              style={styles.input}
            />

            {suggestions.length > 0 && (
              <div style={styles.suggestionsBox}>
                {suggestions.map((product, idx) => (
                  <div
                    key={idx}
                    onClick={() => selectProduct(product)}
                    style={{
                      padding: "10px",
                      cursor: "pointer",
                      borderBottom: "1px solid rgba(255,255,255,0.1)",
                      color: "#fff"
                    }}
                    onMouseEnter={(e) =>
                      (e.target.style.background = "rgba(255,255,255,0.1)")
                    }
                    onMouseLeave={(e) =>
                      (e.target.style.background = "transparent")
                    }
                  >
                    {product.name} - ₹{product.price}
                  </div>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <input
              placeholder="Scan Barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              style={{ ...styles.input, flex: 1 }}
            />
            <button onClick={addItem} style={styles.button}>
              Add
            </button>
          </div>

          <div style={styles.totalsBox}>
            <h3>Subtotal: ₹{subtotal.toFixed(2)}</h3>
            <h3>GST: ₹{gstAmount.toFixed(2)}</h3>
            <h2>Total: ₹{totalAmount.toFixed(2)}</h2>

            <button
              disabled={items.length === 0}
              onClick={() =>
                navigate("/pos-payment", {
                  state: { items, subtotal, gstAmount, totalAmount }
                })
              }
              style={{
                ...styles.button,
                marginTop: "10px",
                width: "100%",
                opacity: items.length === 0 ? 0.5 : 1
              }}
            >
              Proceed To Payment
            </button>
          </div>
        </div>

        {/* RIGHT SIDE SAME AS BEFORE */}
        <div style={styles.rightPanel}>
          <h2 style={{ color: "#fff" }}>Cart</h2>
          <div style={styles.cartContainer}>
            {items.map((item, idx) => {
              const itemGST = (
                item.price *
                item.quantity *
                item.gst
              ).toFixed(2);

              return (
                <div key={idx} style={styles.cartItem}>
                  <button
                    onClick={() => removeItem(idx)}
                    style={styles.removeBtn}
                  >
                    ✕
                  </button>

                  <div>{item.name}</div>
                  <div>₹{item.price}</div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "5px" }}>
                    <button onClick={() => decreaseQty(idx)} style={styles.smallBtn}>−</button>
                    <span>Qty: {item.quantity}</span>
                    <button onClick={() => increaseQty(idx)} style={styles.smallBtn}>+</button>
                  </div>

                  <div>GST: ₹{itemGST}</div>
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}

export default POSProducts;