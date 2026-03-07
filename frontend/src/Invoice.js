import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

function Invoice() {

  const { invoiceNumber } = useParams();
  const [invoiceData, setInvoiceData] = useState(null);

  useEffect(() => {

    const fetchInvoice = async () => {
      try {
        const token = localStorage.getItem("token");

        const response = await axios.get(
          `http://localhost:5000/invoice/${invoiceNumber}`,
          {
            headers: { Authorization: `Bearer ${token}` }
          }
        );

        setInvoiceData(response.data);

      } catch (error) {
        alert("Error loading invoice");
      }
    };

    fetchInvoice();

  }, [invoiceNumber]); // 👈 important dependency

  if (!invoiceData) return <p>Loading...</p>;

  const { invoice, items, payments } = invoiceData;

  return (
    <div style={{ width: "300px", margin: "auto", padding: "20px" }}>
      <h3 style={{ textAlign: "center" }}>DELULU BILLING</h3>
      <p>Invoice: {invoice.invoice_number}</p>
      <p>Date: {new Date(invoice.created_at).toLocaleString()}</p>
      <hr />

      {items.map((item, index) => (
        <div key={index}>
          <p>
            {item.name} x {item.quantity}
          </p>
          <p>₹{Number(item.total).toFixed(2)}</p>
          <hr />
        </div>
      ))}

      <h4>Total: ₹{Number(invoice.net_amount).toFixed(2)}</h4>

      <h4>Payments:</h4>
      {payments.map((pay, index) => (
        <p key={index}>
          {pay.payment_method} - ₹{Number(pay.amount).toFixed(2)}
        </p>
      ))}

      <br />

      <button onClick={() => window.print()}>
        Print Invoice
      </button>

    </div>
  );
}

export default Invoice;