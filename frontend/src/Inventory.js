import { useEffect, useState } from "react";
import axios from "axios";

function Inventory() {

  const [products, setProducts] = useState([]);
  const [form, setForm] = useState({
    name: "",
    barcode: "",
    price: "",
    stock: ""
  });

  const [editingId, setEditingId] = useState(null);

  // ===============================
  // FETCH PRODUCTS
  // ===============================
  const fetchProducts = async () => {

    try {
      const token = localStorage.getItem("token");

      const response = await axios.get(
        "https://delulu-billing-pos-system.onrender.com/products",
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setProducts(response.data);

    } catch (error) {
      alert("Error loading products");
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // ===============================
  // HANDLE INPUT CHANGE
  // ===============================
  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value
    });
  };

  // ===============================
  // ADD OR UPDATE PRODUCT
  // ===============================
  const handleSubmit = async () => {

    const token = localStorage.getItem("token");

    try {

      if (editingId) {
        await axios.put(
          `https://delulu-billing-pos-system.onrender.com/update-product/${editingId}`,
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Product updated");
      } else {
        await axios.post(
          "https://delulu-billing-pos-system.onrender.com/add-product",
          form,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        alert("Product added");
      }

      setForm({ name: "", barcode: "", price: "", stock: "" });
      setEditingId(null);
      fetchProducts();

    } catch (error) {
      alert("Error saving product");
    }
  };

  // ===============================
  // EDIT PRODUCT
  // ===============================
  const editProduct = (product) => {
    setForm(product);
    setEditingId(product.id);
  };

  // ===============================
  // DELETE PRODUCT
  // ===============================
  const deleteProduct = async (id) => {

    const token = localStorage.getItem("token");

    try {
      await axios.delete(
        `https://delulu-billing-pos-system.onrender.com/delete-product/${id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      alert("Product deleted");
      fetchProducts();

    } catch (error) {
      alert("Error deleting product");
    }
  };

  return (
    <div style={{ padding: "40px", fontFamily: "Arial" }}>

      <h1>INVENTORY MANAGEMENT</h1>

      <div style={{ marginBottom: "30px" }}>
        <input
          name="name"
          placeholder="Product Name"
          value={form.name}
          onChange={handleChange}
        />
        <input
          name="barcode"
          placeholder="Barcode"
          value={form.barcode}
          onChange={handleChange}
        />
        <input
          name="price"
          placeholder="Price"
          value={form.price}
          onChange={handleChange}
        />
        <input
          name="stock"
          placeholder="Stock"
          value={form.stock}
          onChange={handleChange}
        />

        <button onClick={handleSubmit}>
          {editingId ? "Update Product" : "Add Product"}
        </button>
      </div>

      <table border="1" cellPadding="10" width="100%">
        <thead>
          <tr>
            <th>Name</th>
            <th>Barcode</th>
            <th>Price</th>
            <th>Stock</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {products.map((product) => (
            <tr
              key={product.id}
              style={{
                backgroundColor:
                  product.stock < 5 ? "#ffdddd" : "white"
              }}
            >
              <td>{product.name}</td>
              <td>{product.barcode}</td>
              <td>₹{product.price}</td>
              <td>{product.stock}</td>
              <td>
                <button onClick={() => editProduct(product)}>
                  Edit
                </button>
                <button
                  onClick={() => deleteProduct(product.id)}
                  style={{ marginLeft: "10px" }}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>

      </table>

    </div>
  );
}

export default Inventory;