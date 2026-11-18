# SokoBora Kenya 🇰🇪 — Jukwaa Kuu la Mtandao (E-Commerce Platform)

A full-stack, Kenyan-themed E-Commerce web application built with **Vue 3** and an **Express + SQLite relational database backend**.

Designed and implemented in accordance with all project specifications with authentic Kenyan context:
1. **Register (Jisajili)** — User account creation with Kenyan phone formatting (`2547XXXXXXXX`), County & Estate selection, and secure password hashing.
2. **Login (Ingia)** — JWT-based authentication for registered users, automatic device tracking, and persistent cart restoration.
3. **Browse Product Catalogue (Duka la Bidhaa)** — Curated Kenyan departments (*Smartphones & Simu, Laptops & Tarakilishi, Sauti & Wearables, Mitindo & Kenyan Fashion, Boma & Smart Living*). Features genuine Kenyan brands (Bata Safari Boots, Ramtons Kenya, Oraimo, Nyeri AA Coffee, Maasai Narok beadwork) with KEBS compliance stamps.
4. **Load Products onto the Shopping Cart (Kikapu cha Ununuzi)** — Database-backed shopping cart stored in SQLite (`cart_items` table), preventing cart loss and enabling cross-device sync, with 16% Kenya VAT (KRA) and Nairobi/Upcountry shipping rates.
5. **Simulate Payment (Lipa Na M-PESA)** — Built with Safaricom Daraja M-Pesa API sandbox credentials from `rideconnect` (Paybill `174379`, Passkey `bfb279f...`), featuring an authentic on-screen Safaricom SIM prompt, Hakikisha business name verification (*SOKO BORA RETAIL KENYA*), PIN entry (`1234`), and official Safaricom SMS receipt simulation.
6. **Use More Than One Device to Shop (Vifaa Vingi)** — Database cart persistence synced in real time across Kenyan smartphones (Tecno, Samsung Galaxy, Infinix), tablets, and computers; active device tracker; and interactive device profile switcher.

---

## 🇰🇪 Kenyan Theme Elements

- **Brand & Store Name:** **SokoBora Kenya** ("Duka Kuu La Mtandao")
- **Currency & Pricing:** Kenyan Shillings (**KSh / KES**) formatted with commas (e.g. `KSh 185,000`, `KSh 6,800`)
- **Taxation:** 16% Kenya Value Added Tax (VAT / KRA compliant)
- **Delivery & Shipping:** 
  - Free Delivery across Kenya for orders above KSh 10,000
  - Nairobi Standard Courier / Rider: KSh 250 (Same-Day)
  - Upcountry Counties (G4S / Fargo Courier): KSh 450
- **Headquarters & Pick-up Locations:** The Mirage Tower, Floor 4, Chiromo Road, Westlands, Nairobi, Kenya
- **Delivery Coverage:** All 47 Counties of Kenya (Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Kisii, Kiambu, Machakos, Kajiado, Nyeri, etc.)
- **Payment Gateway:** **Lipa Na M-PESA** (Safaricom Daraja API Paybill `174379`)

---

## 🛠️ Technology Stack & Framework

- **Frontend Framework:** **Vue 3** (Composition API, `<script setup>`)
- **Build Tool:** Vite
- **State Management:** Pinia (modular stores for Auth, Cart, Products)
- **Routing:** Vue Router 4 (HTML5 History mode)
- **Styling:** Custom Kenyan Modern Design System (`style.css`), Safaricom green branding (`#059669`), Kenyan tricolor banner, Plus Jakarta Sans & Inter typography
- **Back End Framework:** Express.js REST API
- **Database:** SQLite3 (`ecommerce.db`), persistent relational database
- **Payment Gateway:** Safaricom Daraja Online (Sandbox Paybill: `174379`) + In-App STK Push Simulator

---

## 🚀 Quick Start Guide

In the root project directory (`/Users/macheraweine/Documents/e-commerce`):

```bash
cd /Users/macheraweine/Documents/e-commerce
npm start
```

This single command starts both:
- **Backend API:** `http://localhost:5001` (Health check: `http://localhost:5001/api/health`)
- **Frontend App:** `http://localhost:5173`

Open **http://localhost:5173** in your browser.

---

## 🔑 Account Access

Create an account from the registration page, then sign in with your registered email and password.

---

## 📋 Feature Breakdown

### 1. User Registration (`/register`)
- Captures Full Name, Email, Safaricom Phone Number (`2547XXXXXXXX`), County (Nairobi, Mombasa, Kisumu, Kisii, etc.), and Estate.
- Securely hashes passwords with `bcryptjs`.
- Automatically logs the initial Kenyan client device session in the database.

### 2. User Login (`/login`)
- Authenticates email and password.
- Issues JWT token valid for 7 days.
- Automatically merges any guest cart items into the user's permanent database cart.

### 3. Browse Product Catalogue (`/catalogue`)
- 5 Kenyan Departments:
  1. **Smartphones & Simu** (iPhone 15 Pro Max Safaricom 5G, Samsung Galaxy S24 Ultra Dual SIM East Africa, Tecno Camon 30 Premier 5G)
  2. **Laptops & Tarakilishi** (MacBook Pro 16" M3 Max, HP Pavilion 15 Nairobi Edition, Dell XPS 15)
  3. **Sauti & Wearables** (Sony WH-1000XM5, Oraimo FreePods 4 Pro HavyBass, Apple Watch Ultra 2)
  4. **Mitindo & Kenyan Fashion** (Original Bata Safari Boots, Handcrafted Maasai Narok Beaded Leather Belt, Nairobi Shujaa Streetwear Hoodie)
  5. **Boma & Smart Living** (Starlink Kenya Satellite Kit, Ramtons 4-Gas Cooker, Nyeri Hill Estate AA Whole Bean Arabica Coffee)
- Real-time search, category pills, brand filters, and price sorting.
- Product detail pages (`/product/:slug`) with KEBS approval seals and East Africa warranty.

### 4. Load Products onto the Shopping Cart (`/cart`)
- Add products with custom quantities.
- Persistent backend storage in the `cart_items` table in SQLite.
- Dynamic calculation of Subtotal, 16% Kenya VAT (KRA), and delivery fees.

### 5. Simulate Payment & Safaricom Daraja M-Pesa (`/checkout`)
Configured with the M-Pesa Daraja Sandbox credentials from `rideconnect`:
- **Business Name:** SOKO BORA RETAIL KENYA
- **Paybill:** `174379`
- **Passkey:** `bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919`
- **Interactive STK Push Simulator:** Pops up an authentic Safaricom handset prompt showing total amount in KSh, Paybill `174379`, and account reference (`SOKO-KE-XXXX`). Enter demo PIN `1234` to receive the official Safaricom SMS receipt.
- **Real Daraja STK Push:** Directly contacts the Safaricom Daraja endpoint.

### 6. Use More Than One Device to Shop (`/devices`)
- **Database-Backed Cart:** Items added from any device are saved in SQLite under `user_id`, meaning logging in from a phone, laptop, or tablet in Nairobi or Mombasa immediately pulls the exact same cart.
- **Multi-Device Hub (`/devices`):** Displays all active sessions registered in the `user_devices` database table with device names (`MacBook Pro - Nairobi Office`, `Tecno Camon 30 Pro (Safaricom 5G)`, `Samsung Galaxy A54 (Airtel Kenya)`).
- **1-Click Device Profile Switcher:** Located in the top header banner to simulate shopping as different Kenyan devices.
