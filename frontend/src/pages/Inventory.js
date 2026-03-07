import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Inventory() {
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [showLowStock, setShowLowStock] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    barcode: "",
    price: "",
    stock: "",
    gst_percentage: ""
  });

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/products", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setProducts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        "http://localhost:5000/add-product",
        formData,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      fetchProducts();

      setFormData({
        name: "",
        barcode: "",
        price: "",
        stock: "",
        gst_percentage: ""
      });

    } catch (err) {
      alert("Failed to add product");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this product?")) return;

    await axios.delete(`http://localhost:5000/products/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    fetchProducts();
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      barcode: product.barcode,
      price: product.price,
      stock: product.stock,
      gst_percentage: product.gst_percentage
    });
  };

  const handleUpdate = async (e) => {
    e.preventDefault();

    await axios.put(
      `http://localhost:5000/products/${editingId}`,
      formData,
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setEditingId(null);

    setFormData({
      name: "",
      barcode: "",
      price: "",
      stock: "",
      gst_percentage: ""
    });

    fetchProducts();
  };

  const filteredProducts = products
  .slice()
  .sort((a, b) =>
    a.name.toLowerCase().localeCompare(b.name.toLowerCase())
  )
  .filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )
  .filter((p) =>
    showLowStock ? Number(p.stock) <= 10 : true
  );

  return (
    <div style={styles.container}>
      <h1 style={styles.mainTitle}>Delulu Inventory</h1>

      <div style={styles.mainContent}>

        {/* LEFT SIDE - FORM */}
        <div style={styles.formSection}>
          <h3>{editingId ? "Edit Product" : "Add Product"}</h3>

          <form onSubmit={editingId ? handleUpdate : handleAddProduct}>
            <div style={styles.formGrid}>
              <input
                name="name"
                placeholder="Product Name"
                value={formData.name}
                onChange={handleChange}
                required
                style={styles.input}
              />

              <input
                name="barcode"
                placeholder="Barcode"
                value={formData.barcode}
                onChange={handleChange}
                required
                style={styles.input}
              />

              <input
                type="number"
                name="price"
                placeholder="Base Price"
                value={formData.price}
                onChange={handleChange}
                required
                style={styles.input}
              />

              <input
                type="number"
                name="gst_percentage"
                placeholder="GST %"
                value={formData.gst_percentage}
                onChange={handleChange}
                required
                style={styles.input}
              />

              <input
                type="number"
                name="stock"
                placeholder="Stock"
                value={formData.stock}
                onChange={handleChange}
                required
                style={styles.input}
              />
            </div>

            <button style={styles.saveBtn}>
              {editingId ? "Update Product" : "Add Product"}
            </button>
          </form>
        </div>

        {/* RIGHT SIDE - TABLE */}
        <div style={styles.tableSection}>
          <input
            type="text"
            placeholder="Search product..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={styles.search}
          />

          <div style={styles.filterRow}>
  <button
    style={{
      ...styles.filterBtn,
      backgroundColor: showLowStock ? "#ef4444" : "#334155"
    }}
    onClick={() => setShowLowStock(!showLowStock)}
  >
    {showLowStock ? "Show All Products" : "Show Low Stock"}
  </button>
</div>
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Name</th>
                  <th style={styles.th}>Barcode</th>
                  <th style={styles.th}>Price</th>
                  <th style={styles.th}>GST %</th>
                  <th style={styles.th}>Stock</th>
                  <th style={styles.th}>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td style={styles.td}>{product.name}</td>
                    <td style={styles.td}>{product.barcode}</td>
                    <td style={styles.td}>₹{product.price}</td>
                    <td style={styles.td}>{product.gst_percentage}%</td>

                    <td
                      style={{
                        ...styles.td,
                        color: product.stock <= 10 ? "red" : "#22c55e",
                        fontWeight: "bold"
                      }}
                    >
                      {product.stock}
                    </td>

                    <td style={styles.actionCell}>
                      <button
                        style={styles.editBtn}
                        onClick={() => handleEdit(product)}
                      >
                        Edit
                      </button>

                      <button
                        style={styles.deleteBtn}
                        onClick={() => handleDelete(product.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>

            </table>
          </div>
        </div>

      </div>
    </div>
  );
}

const styles = {
  container: {
    height: "100vh",
    background: "#0f172a",
    padding: "30px",
    paddingTop: "140px",
    color: "white",
    fontFamily: "Segoe UI, sans-serif",
    overflow: "hidden"
  },
  mainTitle: {
  textAlign: "center",
  marginBottom: "30px",
  fontSize: "32px",
  fontWeight: "900",
  letterSpacing: "3px",
  textTransform: "uppercase",
  background: "linear-gradient(90deg, #00f5ff, #ff00cc, #00f5ff)",
  backgroundSize: "300%",
  WebkitBackgroundClip: "text",
  WebkitTextFillColor: "transparent",
  textShadow: "0 0 20px rgba(0,255,255,0.6)",
  animation: "glowMove 6s linear infinite"
},
  mainContent: {
    display: "flex",
    height: "85%"
  },
  formSection: {
    width: "25%",
    background: "#1e293b",
    padding: "20px",
    borderRadius: "10px",
    marginRight: "20px"
  },
  tableSection: {
    width: "75%",
    display: "flex",
    flexDirection: "column"
  },
  tableWrapper: {
    flex: 1,
    overflowY: "auto",
    background: "#1e293b",
    borderRadius: "10px",
    padding: "10px"
  },
  formGrid: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
    marginBottom: "15px"
  },
  input: {
    padding: "10px",
    borderRadius: "6px",
    border: "1px solid #334155",
    background: "#0f172a",
    color: "white"
  },
  saveBtn: {
    background: "#22c55e",
    color: "white",
    padding: "10px",
    border: "none",
    borderRadius: "6px",
    cursor: "pointer"
  },
  search: {
    padding: "10px",
    marginBottom: "10px",
    borderRadius: "6px",
    border: "1px solid #334155",
    background: "#1e293b",
    color: "white"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse"
  },
  th: {
    textAlign: "left",
    padding: "10px",
    borderBottom: "1px solid #334155"
  },
  td: {
    padding: "10px",
    borderBottom: "1px solid #1e293b"
  },
  actionCell: {
    display: "flex",
    gap: "10px"
    
  },
  editBtn: {
    background: "#3b82f6",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer"
  },
  deleteBtn: {
    background: "#ef4444",
    color: "white",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    cursor: "pointer"
  }
  
  

};

export default Inventory;