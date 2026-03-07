import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import POSProducts from "./pages/POSProducts";   // ✅ Updated
import POSPayment from "./pages/POSPayment";     // ✅ Added
import Invoice from "./Invoice";
import Inventory from "./pages/Inventory";
import Header from "./components/Header";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ================= LOGIN ================= */}
        <Route path="/" element={<Login />} />

        {/* ================= DASHBOARD ================= */}
        <Route
          path="/dashboard"
          element={
            <>
              <Header />
              <Dashboard />
            </>
          }
        />

        {/* ================= POS PRODUCTS ================= */}
        <Route
          path="/pos"
          element={
            <>
              <Header />
              <POSProducts />
            </>
          }
        />

        {/* ================= POS PAYMENT ================= */}
        <Route
          path="/pos-payment"
          element={
            <>
              <Header />
              <POSPayment />
            </>
          }
        />

        {/* ================= INVENTORY ================= */}
        <Route
          path="/inventory"
          element={
            <>
              <Header />
              <Inventory />
            </>
          }
        />

        {/* ================= INVOICE ================= */}
        <Route
          path="/invoice/:invoiceNumber"
          element={<Invoice />}
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;