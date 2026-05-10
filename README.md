# MediCore 🏥

MediCore is a full-stack healthcare management platform designed to simplify doctor appointments, healthcare services, and admin management through a modern and responsive web application.

The platform provides separate interfaces for:
- Patients / Users
- Doctors
- Admin Panel

MediCore helps users book appointments, explore healthcare services, and manage medical interactions efficiently.

---

# 🚀 Features

## 👤 User Features
- Browse doctors and healthcare services
- View doctor details and profiles
- Book appointments online
- Online payment success/failure handling
- Responsive modern UI
- Contact page and testimonials
- Authentication system

---

## 🩺 Doctor Features
- Doctor dashboard
- Manage profile information
- Edit doctor details
- View appointments
- Doctor-specific navigation and pages

---

## 🛠️ Admin Features
- Admin dashboard
- Add new doctors
- Add healthcare services
- Manage appointments
- Manage service appointments
- View doctor/service lists

---

## ⚙️ Backend Features
- REST API architecture
- MongoDB database integration
- Cloudinary image uploads
- Multer middleware for file handling
- Authentication middleware
- Modular MVC structure

---

# 🧰 Tech Stack

## Frontend
- React.js
- Vite
- Tailwind CSS
- React Router DOM

## Backend
- Node.js
- Express.js
- MongoDB
- Mongoose

## Other Tools & Services
- Cloudinary
- Multer
- ESLint
- Git & GitHub
- Stripe
- Resend 

---

# 📁 Project Structure

```bash
MediCore/
│
├── admin/        # Admin dashboard application
├── frontend/     # Main frontend application
├── server/       # Backend API and database logic
```

---

# ⚡ Installation & Setup

## 1️⃣ Clone Repository

```bash
git clone https://github.com/your-username/MediCore.git
```

---

## 2️⃣ Navigate to Project

```bash
cd MediCore
```

---

# 🔹 Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

---

# 🔹 Admin Setup

```bash
cd admin
npm install
npm run dev
```

---

# 🔹 Server Setup (Backend)

```bash
cd server
npm install
npm run dev (in development mode)
npm start (in production mode)
```

---

# 🔐 Environment Variables

Create a `.env` file inside the `server` folder and add:

```env
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
MONGODB_URI=your_mongodb_connection
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
JWT_SECRET=your_jwt_secret
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
FRONTEND_URL=your_frontend_url
ADMIN_URL=your_admin_url
PORT=5000/3000

```

Create a `.env` file inside the `frontend` folder and add:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_vite_clerk_publishable_key
VITE_API_BASE=your_vite_api_base
```

Create a `.env` file inside the `admin` folder and add:

```env
VITE_CLERK_PUBLISHABLE_KEY=your_vite_clerk_publishable_key
VITE_API_BASE=your_vite_api_base
```
---


# 📄 License

This project is licensed under the MIT License.

---

# 👨‍💻 Developed By

### Shivansh Mishra

Full Stack Web Developer 🚀
