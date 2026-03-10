import { useState, useRef } from "react";
import axios from "axios";

function POS() {
  const [barcode, setBarcode] = useState("");
  const [items, setItems] = useState([]);
  const [subtotal, setSubtotal] = useState(0);
  const [gstAmount, setGstAmount] = useState(0);
  const [totalAmount, setTotalAmount] = useState(0);

  const [payments, setPayments] = useState([]);
  const [method, setMethod] = useState("Cash");
  const [amount, setAmount] = useState("");

  const [showPayment] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const searchTimeout = useRef(null);

  // ===============================
  // ADD ITEM BY BARCODE
  // ===============================
  const addItem = async () => {
    if (!barcode.trim()) return;

    try {
      const token = localStorage.getItem("token");
      const response = await axios.get(
        `https://delulu-pos-system-1.onrender.com/api/products/${barcode.trim()}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const product = response.data;
      const existingIndex = items.findIndex((i) => i.barcode === product.barcode);

      let updatedItems = [...items];
      if (existingIndex !== -1) {
        updatedItems[existingIndex].quantity += 1;
      } else {
        updatedItems.push({
          barcode: product.barcode,
          name: product.name,
          price: parseFloat(product.price),
          quantity: 1,
          gst: parseFloat(product.gst_percentage) / 100
        });
      }

      setItems(updatedItems);
      calculateTotal(updatedItems);
      setBarcode("");
    } catch {
      alert("Product not found in database");
    }
  };

  // ===============================
  // CALCULATE TOTAL + GST
  // ===============================
  const calculateTotal = (cartItems) => {
  let sub = 0;
  let totalGST = 0;

  cartItems.forEach(item => {
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

  // ===============================
  // PAYMENTS
  // ===============================
  const addPayment = () => {
    if (!amount || parseFloat(amount) <= 0) return alert("Enter valid amount");
    setPayments([...payments, { method, amount: parseFloat(amount) }]);
    setAmount("");
  };

  const removePayment = (index) => setPayments(payments.filter((_, i) => i !== index));
  const totalPaid = parseFloat(payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2));
  const remaining = parseFloat(Math.max(totalAmount - totalPaid, 0).toFixed(2));
  const change = parseFloat(Math.max(totalPaid - totalAmount, 0).toFixed(2));

  // ===============================
  // PRODUCT SEARCH + SUGGESTIONS
  // ===============================
  const searchProducts = (value) => {
    setSearchTerm(value);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (value.length < 1) return setSuggestions([]);

    searchTimeout.current = setTimeout(async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `https://delulu-pos-system-1.onrender.com/api/products/search/${encodeURIComponent(value)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setSuggestions(response.data || []);
      } catch {
        setSuggestions([]);
      }
    }, 300);
  };

  const selectProduct = (product) => {
    const existingIndex = items.findIndex((i) => i.barcode === product.barcode);
    let updatedItems = [...items];
    if (existingIndex !== -1) updatedItems[existingIndex].quantity += 1;
    else updatedItems.push({ barcode: product.barcode, name: product.name, price: parseFloat(product.price), quantity: 1, gst: parseFloat(product.gst_percentage) / 100 });

    setItems(updatedItems);
    calculateTotal(updatedItems);
    setSearchTerm("");
    setSuggestions([]);
  };

  const removeItem = (index) => {
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    calculateTotal(updated);
  };
  

  // ===============================
  // PRINT THERMAL RECEIPT
  // ===============================
  const printThermalReceipt = (invoiceNumber) => {
    let receipt = `<html><head><style>
      body { font-family: monospace; width: 280px; }
      h2 { text-align: center; }
      .location { text-align: center; font-size: 12px; font-weight: bold; margin-bottom: 10px; }
      .line { border-top: 1px dashed black; margin: 5px 0; }
      .row { display: flex; justify-content: space-between; }
      .number { color: green; }
    </style></head><body>
      <h2>DELULU MALL</h2>
       <div class="location">Coimbatore, Tamilnadu</div>
      <div>Invoice: ${invoiceNumber}</div>
      <div>Date: ${new Date().toLocaleString()}</div>
      <div class="line"></div>`;

    items.forEach(item => {
      const itemGST = item.price * item.quantity * item.gst;
      receipt += `<div>${item.name}</div>
        <div class="row">
          <span><span class="number">${item.quantity}</span> x <span class="number">${item.price}</span></span>
          <span class="number">${(item.price * item.quantity).toFixed(2)}</span>
        </div>
        <div class="row">
          <span>GST</span>
          <span class="number">${itemGST.toFixed(2)}</span>
        </div>`;
    });

    receipt += `<div class="line"></div>
      <div class="row"><span>Subtotal</span><span class="number">${subtotal.toFixed(2)}</span></div>
      <div class="row"><span>Total GST</span><span class="number">${gstAmount.toFixed(2)}</span></div>
      <div class="row"><strong>Total</strong><strong class="number">${totalAmount.toFixed(2)}</strong></div>
      <div class="line"></div>`;

    payments.forEach(p => {
      receipt += `<div class="row"><span>${p.method}</span><span class="number">${p.amount.toFixed(2)}</span></div>`;
    });

    receipt += `<div class="line"></div><p style="text-align:center;">Thank You Visit Again</p></body></html>`;

    const win = window.open("", "", "width=300,height=600");
    win.document.write(receipt);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  // ===============================
  // CREATE INVOICE
  // ===============================
  const createInvoice = async () => {
    if (items.length === 0) return alert("Cart is empty");
    if (totalPaid < totalAmount) return alert("Payment not complete");

    try {
      const token = localStorage.getItem("token");
      const response = await axios.post(
        "https://delulu-pos-system-1.onrender.com/create-invoice",
        {
          customer_name: "Walk-in",
          discount: 0,
          items: items.map(i => ({ barcode: i.barcode, quantity: i.quantity })),
          payments
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const invoiceNumber = response.data.invoice_number;
      printThermalReceipt(invoiceNumber);

      setItems([]);
      setPayments([]);
      setSubtotal(0);
      setGstAmount(0);
      setTotalAmount(0);
      setBarcode("");
    } catch {
      alert("Invoice Failed");
    }
  };

  // ===============================
  // ULTRA GLASS STYLE + SCROLLABLE CART
  // ===============================
  const styles = {
    pageContainer: {
  height: "100vh",              // FIXED height
  overflow: "hidden",           // 🚫 No page scroll
  paddingTop: "120px",
  background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
  fontFamily: "Segoe UI, sans-serif",
  paddingLeft: "20px",
  paddingRight: "20px",
  paddingBottom: "20px",
  boxSizing: "border-box"
},
    glassCard: {
  height: "calc(100vh - 160px)",   // Fixed inside screen
  display: "flex",
  borderRadius: "20px",
  background: "rgba(255,255,255,0.08)",
  backdropFilter: "blur(18px)",
  WebkitBackdropFilter: "blur(18px)",
  border: "1px solid rgba(255,255,255,0.2)",
  boxShadow: "0 25px 45px rgba(0,0,0,0.4)",
  overflow: "hidden"
},
    panel: {
  flex: 1,
  padding: "25px",
  overflow: "hidden",  // 🚫 prevent panel scroll
  display: "flex",
  flexDirection: "column"
},
    input: {
      width: "100%",
      padding: "12px",
      borderRadius: "8px",
      border: "1px solid rgba(255,255,255,0.3)",
      fontSize: "14px",
      outline: "none",
      background: "rgba(255,255,255,0.1)",
      color: "#fff",
      marginBottom: "15px"
    },
    button: {
      padding: "12px 20px",
      borderRadius: "8px",
      border: "none",
      background: "linear-gradient(90deg, #00f5ff, #ff00cc)",
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
      marginTop: "10px",
      transition: "all 0.3s ease"
    },
    cartContainer: {
  flex: 1,                // take available space
  overflowY: "auto",      // ✅ scroll only here
  marginBottom: "15px",
  paddingRight: "5px"
},
    cartItem: {
      marginBottom: "8px",
      padding: "8px",
      borderRadius: "8px",
      background: "rgba(255,255,255,0.12)",
      color: "#fff",
      fontSize: "13px"
    },
    gstLine: {
      fontSize: "13px",
      marginTop: "4px",
      color: "#fff"
    },
    gradientTitle: {
      fontSize: "28px",
      fontWeight: "900",
      textAlign: "center",
      marginBottom: "20px",
      background: "linear-gradient(90deg, #00f5ff, #ff00cc, #00f5ff)",
      backgroundSize: "300%",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      animation: "gradientMove 3s linear infinite"
    },
    suggestionItem: {
      padding: "10px",
      cursor: "pointer",
      borderBottom: "1px solid rgba(255,255,255,0.2)"
    },
    brightWhite: {
      color: "#fff"
    },
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.glassCard}>
        {/* Left Panel */}
        <div style={{ ...styles.panel, borderRight: "1px solid rgba(255,255,255,0.2)" }}>
          <h2 style={styles.gradientTitle}>DELULU POS</h2>

          {/* Product Search */}
          <input
            placeholder="Type product name..."
            value={searchTerm}
            onChange={(e) => searchProducts(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (suggestions.length > 0) selectProduct(suggestions[0]);
                else alert("No matching product found");
              }
            }}
            style={styles.input}
          />
          {suggestions.length > 0 && (
            <div style={{
              maxHeight: "150px",
              overflowY: "auto",
              background: "rgba(255,255,255,0.1)",
              borderRadius: "8px",
              marginBottom: "15px",
              color: "#fff"
            }}>
              {suggestions.map((product, idx) => (
                <div
                  key={idx}
                  onClick={() => selectProduct(product)}
                  style={styles.suggestionItem}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = "rgba(0,245,255,0.2)"}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                >
                  <span style={styles.brightWhite}>{product.name} - </span>
                  <span style={{color:'#0f0'}}>₹{product.price}</span>
                </div>
              ))}
            </div>
          )}

          {/* Barcode */}
          <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
            <input
              placeholder="Scan Barcode"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addItem()}
              style={{ ...styles.input, flex: 1 }}
            />
            <button onClick={addItem} style={styles.button}>Add</button>
          </div>

          {/* Scrollable Cart */}
          <div style={styles.cartContainer}>
            {items.map((item, idx) => {
              const itemGST = parseFloat((item.price * item.quantity * item.gst).toFixed(2));
              return (
                <div key={idx} style={styles.cartItem}>
                  <span style={styles.brightWhite}>{item.name} | </span>
                  <span style={{color:'#0f0'}}>₹{item.price}</span>
                  <span style={styles.brightWhite}> | Qty: </span>
                  <span style={{color:'#0f0'}}>{item.quantity}</span>
                  <div style={styles.gstLine}>
                    <span style={styles.brightWhite}>GST: </span>
                    <span style={{color:'#0f0'}}>{itemGST}</span>
                  </div>
                  <button onClick={() => removeItem(idx)} style={styles.button}>Remove</button>
                </div>
              )
            })}
          </div>

          <h3><span style={styles.brightWhite}>Subtotal: </span><span style={{color:'#0f0'}}>₹{subtotal.toFixed(2)}</span></h3>
          <h3><span style={styles.brightWhite}>Total GST: </span><span style={{color:'#0f0'}}>₹{gstAmount.toFixed(2)}</span></h3>
          <h2><span style={styles.brightWhite}>Total: </span><span style={{color:'#0f0'}}>₹{totalAmount.toFixed(2)}</span></h2>
        </div>

        {/* Right Panel */}
        <div style={styles.panel}>
          {showPayment && (
            <div>
              <h3 style={styles.brightWhite}>Payments</h3>
              <div style={{ display: "flex", gap: "10px", marginBottom: "15px" }}>
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value)}
                  style={{
                    ...styles.input,
                    color: "#000",
                    backgroundColor: "#fff",
                    WebkitAppearance: "none",
                    MozAppearance: "none",
                    appearance: "none"
                  }}
                >
                  <option style={{ color: "#000", backgroundColor: "#fff" }}>Cash</option>
                  <option style={{ color: "#000", backgroundColor: "#fff" }}>UPI</option>
                  <option style={{ color: "#000", backgroundColor: "#fff" }}>Card</option>
                </select>
                <input
                  type="number"
                  placeholder="Amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={styles.input}
                  onKeyDown={(e) => e.key === "Enter" && addPayment()} // Enter triggers Add
                />
                <button onClick={addPayment} style={styles.button}>Add</button>
              </div>

              {payments.map((p, idx) => (
                <div key={idx} style={{ ...styles.cartItem, justifyContent: "space-between" }}>
                  <span style={styles.brightWhite}>{p.method} - </span>
                  <span style={{color:'#0f0'}}>₹{p.amount}</span>
                  <button onClick={() => removePayment(idx)} style={styles.button}>Remove</button>
                </div>
              ))}

              <p><span style={styles.brightWhite}>Total Paid: </span><span style={{color:'#0f0'}}>₹{totalPaid.toFixed(2)}</span></p>
              <p><span style={styles.brightWhite}>Remaining: </span><span style={styles.brightWhite}>₹{remaining.toFixed(2)}</span></p>
              <p><span style={styles.brightWhite}>Change: </span><span style={{color:'#0f0'}}>₹{change.toFixed(2)}</span></p>

              <button
                onClick={createInvoice}
                disabled={totalPaid < totalAmount}
                style={{
                  ...styles.button,
                  background: totalPaid >= totalAmount ? "linear-gradient(90deg, #00f5ff, #ff00cc)" : "rgba(255,255,255,0.2)",
                  cursor: totalPaid >= totalAmount ? "pointer" : "not-allowed",
                  marginTop: "20px",
                  width: "100%"
                }}
              >
                Create Invoice
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default POS;