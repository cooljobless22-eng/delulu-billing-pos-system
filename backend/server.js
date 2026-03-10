// ===============================
// DELULU BILLING SYSTEM - SERVER (PRO VERSION) FIXED
// ===============================

const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);
app.use(
  cors({
    origin: "*",
  })
);
app.use(express.json());

const SECRET_KEY = "delulu_secret_key";

// ===============================
// SOCKET.IO SETUP
// ===============================
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

io.on("connection", (socket) => {
    console.log("🟢 Client connected:", socket.id);

    socket.on("disconnect", () => {
        console.log("🔴 Client disconnected:", socket.id);
    });
});

app.set("io", io);

// ===============================
// DATABASE CONNECTION
// ===============================
const db = mysql.createConnection({
    host: "mysql.railway.internal",
    user: "root",
    password: "pnXbcQjnSERozzdMAamzhDhFRnWbrenv",
    database: "railway",
    port: 3306
});

db.connect((err) => {
    if (err) {
        console.log("❌ Database connection failed");
    } else {
        console.log("✅ Database connected");
    }
});

// ===============================
// JWT AUTH MIDDLEWARE
// ===============================
function authenticateToken(req, res, next) {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) return res.status(401).json({ message: "Token required" });

    jwt.verify(token, SECRET_KEY, (err, user) => {
        if (err) return res.status(403).json({ message: "Invalid token" });
        req.user = user;
        next();
    });
}

// ===============================
// ROLE AUTHORIZATION
// ===============================
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: "Access denied. You do not have permission."
            });
        }
        next();
    };
}

// ===============================
// LOGIN (bcrypt secured)
// ===============================
app.post("/login", async (req, res) => {
    const { username, password } = req.body;

    try {
        const [users] = await db.promise().query(
            "SELECT * FROM users WHERE username = ?",
            [username]
        );

        if (users.length === 0) {
            return res.status(400).json({ message: "User not found" });
        }

        const user = users[0];
        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid password" });
        }

        const token = jwt.sign(
            { id: user.id, role: user.role },
            SECRET_KEY,
            { expiresIn: "2h" }
        );

        res.json({ token,username: user.username});

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

//===============================
// SEARCH PRODUCTS BY NAME - FIXED
//===============================
app.get("/api/products/search/:keyword", authenticateToken, async (req, res) => {
  try {
    const keyword = "%" + req.params.keyword.trim().toLowerCase() + "%";

    const [products] = await db.promise().query(
      "SELECT id, name, barcode, price, stock, gst_percentage FROM products WHERE LOWER(name) LIKE ? ORDER BY name LIMIT 10",
      [keyword]
    );

    res.json(products);
  } catch (error) {
    res.status(500).json({ message: "Search failed", error: error.message });
  }
});

// ===============================
// CREATE INVOICE (PROFESSIONAL VERSION) FIXED
// ===============================
app.post(
  "/create-invoice",
  authenticateToken,
  authorizeRoles("admin", "staff"),
  async (req, res) => {

    const { customer_name, discount = 0, payments = [], items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: "No items provided" });
    }

    if (!payments || payments.length === 0) {
      return res.status(400).json({ message: "No payments provided" });
    }

    const mergedItems = {};
    for (let item of items) {
      if (mergedItems[item.barcode]) {
        mergedItems[item.barcode] += item.quantity;
      } else {
        mergedItems[item.barcode] = item.quantity;
      }
    }

    const finalItems = Object.keys(mergedItems).map(barcode => ({
      barcode,
      quantity: mergedItems[barcode]
    }));

    let totalAmount = 0;
    let totalCGST = 0;
    let totalSGST = 0;

    try {
      const detailedItems = [];

      for (let item of finalItems) {

        const [productData] = await db.promise().query(
          "SELECT * FROM products WHERE barcode = ?",
          [item.barcode]
        );

        if (productData.length === 0) {
          return res.status(404).json({ message: "Product not found" });
        }

        const prod = productData[0];

        if (prod.stock < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${prod.name}`
          });
        }

        const price = parseFloat(prod.price);
        const cgstPercent = parseFloat(prod.cgst_percentage);
        const sgstPercent = parseFloat(prod.sgst_percentage);

        const itemTotal = price * item.quantity;
        const cgstAmount = itemTotal * (cgstPercent / 100);
        const sgstAmount = itemTotal * (sgstPercent / 100);

        totalAmount += itemTotal;
        totalCGST += cgstAmount;
        totalSGST += sgstAmount;

        detailedItems.push({
          product: prod,
          quantity: item.quantity,
          price,
          cgst_amount: parseFloat(cgstAmount.toFixed(2)),
          sgst_amount: parseFloat(sgstAmount.toFixed(2)),
          total: parseFloat((itemTotal + cgstAmount + sgstAmount).toFixed(2))
        });
      }

      totalAmount = parseFloat(totalAmount.toFixed(2));
      totalCGST = parseFloat(totalCGST.toFixed(2));
      totalSGST = parseFloat(totalSGST.toFixed(2));

      const grossAmount = parseFloat((totalAmount + totalCGST + totalSGST).toFixed(2));
      const netAmount = parseFloat((grossAmount - discount).toFixed(2));

      let paymentTotal = 0;
      for (let pay of payments) {
        paymentTotal += parseFloat(pay.amount);
      }
      paymentTotal = parseFloat(paymentTotal.toFixed(2));

      if (Math.abs(paymentTotal - netAmount) > 0.01) {
        return res.status(400).json({
          message: "Payment total does not match invoice amount",
          invoice_total: netAmount,
          payment_total: paymentTotal
        });
      }

      const invoiceNumber = "INV" + Date.now();

      const [invoiceResult] = await db.promise().query(
        `INSERT INTO invoices 
        (invoice_number, user_id, customer_name, total_amount, cgst_amount, sgst_amount, discount_amount, net_amount, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [
          invoiceNumber,
          req.user.id,
          customer_name,
          totalAmount,
          totalCGST,
          totalSGST,
          discount,
          netAmount
        ]
      );

      const invoiceId = invoiceResult.insertId;

      for (let item of detailedItems) {
        const prod = item.product;

        await db.promise().query(
          `INSERT INTO invoice_items
          (invoice_id, product_id, quantity, price, cgst_amount, sgst_amount, total)
          VALUES (?, ?, ?, ?, ?, ?, ?)`,
          [
            invoiceId,
            prod.id,
            item.quantity,
            item.price,
            item.cgst_amount,
            item.sgst_amount,
            item.total
          ]
        );

        await db.promise().query(
          `UPDATE products SET stock = stock - ?
           WHERE id = ?`,
          [item.quantity, prod.id]
        );

        if (prod.stock - item.quantity <= 10) {
          const io = req.app.get("io");
          io.emit("lowStockAlert", { product: prod.name });
        }
      }

      for (let pay of payments) {
        await db.promise().query(
          `INSERT INTO payments
           (invoice_id, payment_method, amount)
           VALUES (?, ?, ?)`,
          [
            invoiceId,
            pay.method,
            pay.amount
          ]
        );
      }

      const io = req.app.get("io");
      io.emit("invoiceCreated", {
        invoice_number: invoiceNumber,
        total: netAmount
      });

      res.json({
        message: "Invoice created successfully",
        invoice_id: invoiceId,
        invoice_number: invoiceNumber,
        total: netAmount
      });

    } catch (error) {
      console.error("CREATE INVOICE ERROR:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  }
);

// ===============================
// INVOICE PDF (FIXED PAYMENT FETCH)
// ===============================
app.get("/invoice-pdf/:invoiceNumber", authenticateToken, async (req, res) => {
    const invoiceNumber = req.params.invoiceNumber;

    try {
        const [invoiceData] = await db.promise().query(
            "SELECT * FROM invoices WHERE invoice_number = ?",
            [invoiceNumber]
        );

        if (invoiceData.length === 0) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        const invoice = invoiceData[0];

        const [items] = await db.promise().query(
            `SELECT ii.*, p.name
             FROM invoice_items ii
             JOIN products p ON ii.product_id = p.id
             WHERE ii.invoice_id = ?`,
            [invoice.id]
        );

        const [payments] = await db.promise().query(
            `SELECT payment_method, amount FROM payments WHERE invoice_id = ?`,
            [invoice.id]
        );

        const paymentMethod = payments.length > 0 ? payments[0].payment_method : "N/A";

        const safeNumber = (value) =>
            value !== null && value !== undefined
                ? Number(value).toFixed(2)
                : "0.00";

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename=invoice_${invoiceNumber}.pdf`
        );

        const doc = new PDFDocument({ margin: 40 });
        doc.pipe(res);

        doc.fontSize(18).text("DELULU BILLING SYSTEM", { align: "center" });
        doc.moveDown();

        doc.fontSize(12).text(`Invoice: ${invoice.invoice_number}`);
        doc.text(`Customer: ${invoice.customer_name}`);
        doc.text(`Date: ${invoice.created_at}`);
        doc.text(`Payment Mode: ${paymentMethod}`);
        doc.moveDown();

        doc.text("------------------------------------------");
        doc.moveDown();

        items.forEach(item => {
            doc.text(`Product: ${item.name || "N/A"}`);
            doc.text(`Qty: ${item.quantity}`);
            doc.text(`Price: ₹${safeNumber(item.price)}`);
            doc.text(`CGST: ₹${safeNumber(item.cgst_amount)}`);
            doc.text(`SGST: ₹${safeNumber(item.sgst_amount)}`);
            doc.text(`Total: ₹${safeNumber(item.total)}`);
            doc.moveDown();
        });

        doc.text("------------------------------------------");
        doc.text(`Subtotal: ₹${safeNumber(invoice.total_amount)}`);
        doc.text(`CGST: ₹${safeNumber(invoice.cgst_amount)}`);
        doc.text(`SGST: ₹${safeNumber(invoice.sgst_amount)}`);
        doc.text(`Discount: ₹${safeNumber(invoice.discount_amount)}`);
        doc.fontSize(14).text(`Net Payable: ₹${safeNumber(invoice.net_amount)}`);

        doc.end();

    } catch (error) {
        console.log(error);
        if (!res.headersSent) {
            res.status(500).json({ error: "Failed to generate invoice" });
        }
    }
});

// ===============================
// THERMAL RECEIPT (FIXED PAYMENT FETCH)
// ===============================
app.get("/receipt/:invoiceNumber", authenticateToken, async (req, res) => {

    const invoiceNumber = req.params.invoiceNumber;

    try {
        const [invoiceData] = await db.promise().query(
            "SELECT * FROM invoices WHERE invoice_number = ?",
            [invoiceNumber]
        );

        if (invoiceData.length === 0) {
            return res.status(404).json({ message: "Invoice not found" });
        }

        const invoice = invoiceData[0];

        const [items] = await db.promise().query(
            `SELECT ii.*, p.name
             FROM invoice_items ii
             JOIN products p ON ii.product_id = p.id
             WHERE ii.invoice_id = ?`,
            [invoice.id]
        );

        const [payments] = await db.promise().query(
            `SELECT payment_method, amount FROM payments WHERE invoice_id = ?`,
            [invoice.id]
        );

        const paymentMethod = payments.length > 0 ? payments[0].payment_method : "N/A";

        const safeNumber = (value) =>
            value !== null && value !== undefined
                ? Number(value).toFixed(2)
                : "0.00";

        const doc = new PDFDocument({
            size: [226, 600],
            margin: 10
        });

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader(
            "Content-Disposition",
            `inline; filename=receipt_${invoiceNumber}.pdf`
        );

        doc.pipe(res);

        doc.fontSize(10).text("DELULU BILLING", { align: "center" });
        doc.text("coimbatore, India", { align: "center" });
        doc.text("GSTIN: 33ABCDE1234F1Z5", { align: "center" });
        doc.moveDown();

        doc.text(`Invoice: ${invoice.invoice_number}`);
        doc.text(`Date: ${invoice.created_at}`);
        doc.text(`Payment Mode: ${paymentMethod}`);
        doc.moveDown();

        doc.text("--------------------------------");

        items.forEach(item => {
            doc.text(item.name);
            doc.text(
                `${item.quantity} x ₹${safeNumber(item.price)} = ₹${safeNumber(item.total)}`
            );
            doc.moveDown();
        });

        doc.text("--------------------------------");
        doc.text(`Subtotal: ₹${safeNumber(invoice.total_amount)}`);
        doc.text(`CGST: ₹${safeNumber(invoice.cgst_amount)}`);
        doc.text(`SGST: ₹${safeNumber(invoice.sgst_amount)}`);
        doc.text(`Discount: ₹${safeNumber(invoice.discount_amount)}`);
        doc.moveDown();
        doc.fontSize(12).text(`TOTAL: ₹${safeNumber(invoice.net_amount)}`);
        doc.moveDown();

        doc.text("Thank You! Visit Again!", { align: "center" });

        doc.end();

    } catch (error) {
        if (!res.headersSent) {
            res.status(500).json({ error: "Receipt generation failed" });
        }
    }
});

// ===============================
// ADMIN SALES REPORT (FIXED)
// ===============================
app.get(
    "/admin/sales-report",
    authenticateToken,
    authorizeRoles("admin"),
    async (req, res) => {
        try {
            const [report] = await db.promise().query(
                `SELECT 
                    COUNT(*) as total_invoices,
                    IFNULL(SUM(net_amount), 0) as total_revenue
                 FROM invoices`
            );

            res.json({
                message: "Admin Sales Report",
                data: report[0]
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);
// ===============================
// ADMIN - TOP SELLING PRODUCTS
// ===============================
app.get(
    "/admin/top-products",
    authenticateToken,
    authorizeRoles("admin"),
    async (req, res) => {
        try {

            const [report] = await db.promise().query(
                `SELECT 
                    p.name AS product_name,
                    SUM(ii.quantity) AS total_quantity_sold,
                    IFNULL(SUM(ii.total), 0) AS total_revenue
                 FROM invoice_items ii
                 JOIN products p ON ii.product_id = p.id
                 GROUP BY ii.product_id
                 ORDER BY total_quantity_sold DESC`
            );

            res.json({
                message: "Top Selling Products",
                data: report
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);
// ===============================
// DATE FILTER SALES REPORT
// ===============================
app.get(
    "/admin/sales-report/filter",
    authenticateToken,
    authorizeRoles("admin"),
    async (req, res) => {

        const type = req.query.type;

        let condition = "";

        if (type === "today") {
            condition = "DATE(created_at) = CURDATE()";
        } 
        else if (type === "monthly") {
            condition = "MONTH(created_at) = MONTH(CURDATE()) AND YEAR(created_at) = YEAR(CURDATE())";
        } 
        else if (type === "yearly") {
            condition = "YEAR(created_at) = YEAR(CURDATE())";
        } 
        else {
            return res.status(400).json({ message: "Invalid filter type" });
        }

        try {
            const [report] = await db.promise().query(
                `SELECT 
                    COUNT(*) as total_invoices,
                    COALESCE(SUM(net_amount),0) as total_revenue
                 FROM invoices
                 WHERE ${condition}`
            );

            res.json({
                filter: type,
                data: report[0]
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);
// ===============================
// LOW STOCK ALERT
// ===============================
app.get(
    "/admin/low-stock",
    authenticateToken,
    authorizeRoles("admin"),
    async (req, res) => {

        const threshold = 10; // below 10 is low stock

        try {
            const [products] = await db.promise().query(
                "SELECT * FROM products WHERE stock <= ?",
                [threshold]
            );

            res.json({
                message: "Low Stock Products",
                data: products
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);
// ===============================
// CREATE CUSTOMER
// ===============================
app.post("/customers", authenticateToken, async (req, res) => {

    const { name, phone, email, address } = req.body;

    try {
        await db.promise().query(
            "INSERT INTO customers (name, phone, email, address) VALUES (?, ?, ?, ?)",
            [name, phone, email, address]
        );

        res.json({ message: "Customer added successfully" });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ===============================
// GET ALL CUSTOMERS
// ===============================
app.get("/customers", authenticateToken, async (req, res) => {

    try {
        const [customers] = await db.promise().query(
            "SELECT * FROM customers"
        );

        res.json(customers);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// ===============================
// FULL DASHBOARD OVERVIEW
// ===============================
app.get(
    "/admin/dashboard",
    authenticateToken,
    authorizeRoles("admin"),
    async (req, res) => {

        try {

            const [sales] = await db.promise().query(
                "SELECT COALESCE(SUM(net_amount),0) as total_revenue FROM invoices"
            );

            const [invoiceCount] = await db.promise().query(
                "SELECT COUNT(*) as total_invoices FROM invoices"
            );

            const [productCount] = await db.promise().query(
                "SELECT COUNT(*) as total_products FROM products"
            );

            const [lowStock] = await db.promise().query(
                "SELECT COUNT(*) as low_stock_count FROM products WHERE stock <= 10"
            );
            const [recentInvoices] = await db.promise().query(
             `SELECT 
             invoice_number,
             customer_name,
             net_amount AS amount,
             DATE(created_at) AS date,
             'Paid' AS status
             FROM invoices
             ORDER BY created_at DESC
             LIMIT 5`
            );
            const [monthlyRevenue] = await db.promise().query(
             `SELECT 
             MONTH(created_at) AS month,
             COALESCE(SUM(net_amount),0) AS total
             FROM invoices
             WHERE YEAR(created_at) = YEAR(CURDATE())
             GROUP BY MONTH(created_at)`
            );
            const monthlyData = new Array(12).fill(0);

             monthlyRevenue.forEach(row => {
             monthlyData[row.month - 1] = row.total;
       });

            res.json({
                total_revenue: sales[0].total_revenue,
                total_invoices: invoiceCount[0].total_invoices,
                total_products: productCount[0].total_products,
                low_stock_products: lowStock[0].low_stock_count,
                recent_invoices: recentInvoices,
                monthly_revenue: monthlyData
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);
// ===============================
// ADMIN - EXPORT SALES TO EXCEL
// ===============================
app.get(
    "/admin/export-sales",
    authenticateToken,
    authorizeRoles("admin"),
    async (req, res) => {

        try {

            const [sales] = await db.promise().query(
                `SELECT 
                    invoice_number,
                    customer_name,
                    total_amount,
                    cgst_amount,
                    sgst_amount,
                    discount_amount,
                    net_amount,
                    created_at
                 FROM invoices
                 ORDER BY created_at DESC`
            );

            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet("Sales Report");

            worksheet.columns = [
                { header: "Invoice Number", key: "invoice_number", width: 20 },
                { header: "Customer Name", key: "customer_name", width: 20 },
                { header: "Subtotal", key: "total_amount", width: 15 },
                { header: "CGST", key: "cgst_amount", width: 15 },
                { header: "SGST", key: "sgst_amount", width: 15 },
                { header: "Discount", key: "discount_amount", width: 15 },
                { header: "Net Amount", key: "net_amount", width: 15 },
                { header: "Date", key: "created_at", width: 20 }
            ];

            sales.forEach(row => {
                worksheet.addRow(row);
            });

            res.setHeader(
                "Content-Type",
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            );
            res.setHeader(
                "Content-Disposition",
                "attachment; filename=sales_report.xlsx"
            );

            await workbook.xlsx.write(res);
            res.end();

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);
// ===============================
// ADMIN - PAYMENT METHOD REPORT
// ===============================
app.get(
    "/admin/payment-summary",
    authenticateToken,
    authorizeRoles("admin"),
    async (req, res) => {

        try {

            const [report] = await db.promise().query(
                `SELECT 
                    payment_method,
                    COUNT(*) as total_transactions,
                    COALESCE(SUM(net_amount),0) as total_amount
                 FROM invoices
                 GROUP BY payment_method`
            );

            res.json({
                message: "Payment Summary Report",
                data: report
            });

        } catch (error) {
            res.status(500).json({ error: error.message });
        }
    }
);
// ===============================
// GET PRODUCT BY BARCODE
// ===============================
app.get("/products", authenticateToken, async (req, res) => {

    try {

        const [rows] = await db.promise().query(
            `SELECT id, name, barcode, price, stock, gst_percentage 
             FROM products 
             ORDER BY id DESC`
        );

        res.json(rows);

    } catch (error) {
        console.log(error);
        res.status(500).json({ error: error.message });
    }
});
// ===============================
// Barcode Fetch
// ===============================
app.get("/api/products/:barcode", (req, res) => {
    const barcode = req.params.barcode.trim();

    db.query(
        "SELECT * FROM products WHERE barcode = ?",
        [barcode],
        (err, result) => {
            if (err) {
                return res.status(500).json({ message: "Database error" });
            }

            if (result.length === 0) {
                return res.status(404).json({ message: "Product not found" });
            }

            res.json(result[0]);
        }
    );
});
// ===============================
// ADD PRODUCT (GST FIXED VERSION)
// ===============================
app.post("/add-product", authenticateToken, async (req, res) => {

    const { name, barcode, price, stock, gst_percentage } = req.body;

    try {

        const gst = parseFloat(gst_percentage) || 0;

        // Split GST into CGST & SGST automatically
        const cgst = gst / 2;
        const sgst = gst / 2;

        await db.promise().query(
            `INSERT INTO products 
            (name, barcode, price, stock, gst_percentage, hsn_code, cgst_percentage, sgst_percentage)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                name,
                barcode,
                parseFloat(price),
                parseInt(stock),
                gst,          // ✅ using real GST
                "0000",
                cgst,         // ✅ calculated CGST
                sgst          // ✅ calculated SGST
            ]
        );

        res.json({ message: "Product added successfully" });

    } catch (error) {
        console.log("ADD PRODUCT ERROR:", error);
        res.status(500).json({ error: error.message });
    }
});
// ===============================
// UPDATE PRODUCT (GST FIXED)
// ===============================
app.put("/products/:id", authenticateToken, async (req, res) => {

  const { id } = req.params;
  const { name, barcode, price, stock, gst_percentage } = req.body;

  try {

    const gst = parseFloat(gst_percentage) || 0;
    const cgst = gst / 2;
    const sgst = gst / 2;

    await db.promise().query(
      `UPDATE products 
       SET name=?, barcode=?, price=?, stock=?, 
           gst_percentage=?, cgst_percentage=?, sgst_percentage=? 
       WHERE id=?`,
      [
        name,
        barcode,
        parseFloat(price),
        parseInt(stock),
        gst,
        cgst,
        sgst,
        id
      ]
    );

    res.json({ message: "Product updated successfully" });

  } catch (error) {
    console.log("UPDATE PRODUCT ERROR:", error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE PRODUCT
app.delete("/products/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;

  await db.promise().query(
    "DELETE FROM products WHERE id=?",
    [id]
  );

  res.json({ message: "Product deleted" });
});
// ===============================
server.listen(5000, () => {
    console.log("🚀 Server running on port 5000 (Realtime Enabled)");
});
