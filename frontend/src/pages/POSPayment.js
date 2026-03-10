import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import axios from "axios";

function POSPayment() {
  const location = useLocation();
  const navigate = useNavigate();

  const { items, subtotal, gstAmount, totalAmount } = location.state || {};

  const [payments, setPayments] = useState([]);
  const [method, setMethod] = useState("Cash");
  const [amount, setAmount] = useState("");

  if (!items) return <div>Invalid Access</div>;

  // GST Split
  const sgst = gstAmount / 2;
  const cgst = gstAmount / 2;

  const addPayment = () => {
    if (!amount || parseFloat(amount) <= 0)
      return alert("Enter valid amount");

    setPayments([...payments, { method, amount: parseFloat(amount) }]);
    setAmount("");
  };

  const removePayment = (index) => {
    setPayments(payments.filter((_, i) => i !== index));
  };

  const totalPaid = parseFloat(
    payments.reduce((sum, p) => sum + p.amount, 0).toFixed(2)
  );

  const remaining = parseFloat(
    Math.max(totalAmount - totalPaid, 0).toFixed(2)
  );

  const change = parseFloat(
    Math.max(totalPaid - totalAmount, 0).toFixed(2)
  );

  const printThermalReceipt = (invoiceNumber) => {
    let receipt = `
      <html>
      <head>
        <style>
          body { font-family: monospace; width: 280px; }
          h2 { text-align:center; margin:0; }
          .location { text-align:center; font-size:12px; }
          .line { border-top:1px dashed black; margin:5px 0; }
          .row { display:flex; justify-content:space-between; }
        </style>
      </head>
      <body>

        <h2>DELULU MALL</h2>
        <div class="location">Coimbatore, Tamilnadu</div>
        <div class="location">GSTIN: 33ABCDE1234F1Z5</div>

        <div class="line"></div>
        <div>Invoice: ${invoiceNumber}</div>
        <div>Date: ${new Date().toLocaleString()}</div>
        <div class="line"></div>
    `;
    // GST SUMMARY
let gstSummary = {
  5: 0,
  12: 0,
  18: 0,
  28: 0
};

    items.forEach(item => {

  const itemTotal = item.price * item.quantity;

  const gstPercent = item.gst * 100;
  const sgstPercent = gstPercent / 2;
  const cgstPercent = gstPercent / 2;

  const itemGST = itemTotal * item.gst;
  const itemSGST = itemGST / 2;
  const itemCGST = itemGST / 2;

  // ADD TO GST SUMMARY
  if (gstSummary[gstPercent] !== undefined) {
    gstSummary[gstPercent] += itemTotal;
  }

  receipt += `
    <div>${item.name}</div>

    <div class="row">
      <span>${item.quantity} x ${item.price}</span>
      <span>${itemTotal.toFixed(2)}</span>
    </div>

    <div class="row">
      <span>SGST (${sgstPercent}%)</span>
      <span>${itemSGST.toFixed(2)}</span>
    </div>

    <div class="row">
      <span>CGST (${cgstPercent}%)</span>
      <span>${itemCGST.toFixed(2)}</span>
    </div>
  `;
});

    receipt += `
      <div class="line"></div>

      <div class="row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
      <div class="row"><span>SGST</span><span>${sgst.toFixed(2)}</span></div>
      <div class="row"><span>CGST</span><span>${cgst.toFixed(2)}</span></div>

      <div class="row">
        <strong>Total</strong>
        <strong>${totalAmount.toFixed(2)}</strong>
      </div>

      <div class="line"></div>
    `;
    receipt += `
<div class="line"></div>
<div><strong>GST SUMMARY</strong></div>
`;

Object.keys(gstSummary).forEach(rate => {
  if (gstSummary[rate] > 0) {
    receipt += `
      <div class="row">
        <span>${rate}% Items</span>
        <span>${gstSummary[rate].toFixed(2)}</span>
      </div>
    `;
  }
});

    payments.forEach((p) => {
      receipt += `
        <div class="row">
          <span>${p.method}</span>
          <span>${p.amount.toFixed(2)}</span>
        </div>
      `;
    });

    receipt += `
      <div class="line"></div>
      <div class="row">
        <span>Change</span>
        <span>${change.toFixed(2)}</span>
      </div>

      <p style="text-align:center;">Thank You Visit Again</p>
      </body></html>
    `;

    const win = window.open("", "", "width=300,height=600");
    win.document.write(receipt);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const createInvoice = async () => {
    if (totalPaid < totalAmount) return alert("Payment not complete");

    try {
      const token = localStorage.getItem("token");

      const response = await axios.post(
        "https://delulu-pos-system-1.onrender.com/create-invoice",
        {
          customer_name: "Walk-in",
          discount: 0,
          items: items.map((i) => ({
            barcode: i.barcode,
            quantity: i.quantity,
          })),
          payments,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const invoiceNumber = response.data.invoice_number;

      printThermalReceipt(invoiceNumber);
      navigate("/pos-products");
    } catch {
      alert("Invoice Failed");
    }
  };

  const styles = {
    page: {
      height: "100vh",
      background: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)",
      display: "flex",
      justifyContent: "center",
      alignItems: "flex-start",
      paddingTop: "120px",
      fontFamily: "Segoe UI, sans-serif",
    },

    card: {
      width: "680px",
      height: "460px",
      background: "rgba(255,255,255,0.08)",
      backdropFilter: "blur(15px)",
      borderRadius: "15px",
      padding: "18px",
      color: "#fff",
      display: "flex",
      gap: "18px",
      boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
    },

    leftPanel: {
      flex: 1,
      background: "rgba(255,255,255,0.1)",
      borderRadius: "12px",
      padding: "16px",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      fontSize: "14px",
    },

    rightPanel: {
      flex: 1.2,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
    },

    neonTitle: {
      fontSize: "16px",
      fontWeight: "bold",
      marginBottom: "12px",
      background: "linear-gradient(90deg,#ff00cc,#ff66ff)",
      WebkitBackgroundClip: "text",
      WebkitTextFillColor: "transparent",
      textShadow: `
        0 0 5px #ff00cc,
        0 0 10px #ff00cc,
        0 0 20px #ff00cc,
        0 0 40px #ff00cc`,
    },

    paymentInputRow: {
      display: "flex",
      gap: "6px",
      marginBottom: "10px",
    },

    input: {
      flex: 1,
      padding: "6px",
      borderRadius: "6px",
      border: "1px solid rgba(255,255,255,0.3)",
      backgroundColor: "#1f2e3a",
      color: "#fff",
    },

    select: {
      flex: 1,
      padding: "6px",
      borderRadius: "6px",
      border: "1px solid rgba(255,255,255,0.4)",
      backgroundColor: "#1f2e3a",
      color: "#fff",
    },

    button: {
      padding: "6px 10px",
      borderRadius: "6px",
      border: "none",
      background: "linear-gradient(90deg,#00f5ff,#ff00cc)",
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
    },

    paymentItem: {
      display: "flex",
      justifyContent: "space-between",
      padding: "6px",
      background: "rgba(255,255,255,0.12)",
      borderRadius: "6px",
      marginBottom: "6px",
    },

    totalsBox: {
      background: "rgba(255,255,255,0.1)",
      padding: "10px",
      borderRadius: "8px",
      fontSize: "13px",
      marginBottom: "10px",
    },

    confirmButton: {
      padding: "10px",
      borderRadius: "8px",
      border: "none",
      background: "linear-gradient(90deg,#00f5ff,#ff00cc)",
      color: "#fff",
      fontWeight: "bold",
      cursor: "pointer",
    },
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.leftPanel}>
          <h2>Bill Summary</h2>
          <p>Subtotal: ₹{subtotal.toFixed(2)}</p>
          <p>SGST: ₹{sgst.toFixed(2)}</p>
          <p>CGST: ₹{cgst.toFixed(2)}</p>
          <h3>Total: ₹{totalAmount.toFixed(2)}</h3>
        </div>

        <div style={styles.rightPanel}>
          <div>
            <h2 style={styles.neonTitle}>Payment</h2>

            <div style={styles.paymentInputRow}>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                style={styles.select}
              >
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
              </select>

              <input
                type="number"
                placeholder="Amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                style={styles.input}
              />

              <button onClick={addPayment} style={styles.button}>
                Add
              </button>
            </div>

            {payments.map((p, idx) => (
              <div key={idx} style={styles.paymentItem}>
                <span>
                  {p.method} - ₹{p.amount.toFixed(2)}
                </span>
                <button
                  onClick={() => removePayment(idx)}
                  style={styles.button}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div>
            <div style={styles.totalsBox}>
              <p>Total Paid: ₹{totalPaid.toFixed(2)}</p>
              <p>Remaining: ₹{remaining.toFixed(2)}</p>
              <p>Change: ₹{change.toFixed(2)}</p>
            </div>

            <button
              onClick={createInvoice}
              disabled={totalPaid < totalAmount}
              style={{
                ...styles.confirmButton,
                opacity: totalPaid < totalAmount ? 0.5 : 1,
              }}
            >
              Confirm & Print Invoice
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default POSPayment;