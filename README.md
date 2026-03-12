# CodeOptimizer: Algorithmic Training Platform

CodeOptimizer is a web application designed to help users master algorithmic thinking through interactive problem-solving. It provides a structured environment for learning, practicing, and improving coding skills with personalized guidance and real-time feedback.

---

## Tech Stack

This project is a full-stack application built with modern technologies:

* **Frontend**:
    * React
    * TypeScript
    * Vite
    * Tailwind CSS

* **Backend**:
    * Node.js
    * Express
    * MongoDB with Mongoose

* **Authentication**:
    * JWT (JSON Web Tokens)
    * bcryptjs for password hashing

---

## Project Setup

To get this project running on your local machine, you will need to set up both the frontend client and the backend server.

### Prerequisites

* Node.js and npm (or yarn) installed
* A free MongoDB Atlas account (or a local MongoDB instance)

### Backend Setup

1.  **Navigate to the server directory**:
    ```bash
    cd server
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Create a `.env` file**:
    Create a `.env` file in the `server` directory and add your MongoDB connection string and a session secret:
    ```
    MONGO_URI=your_mongodb_connection_string
    SECRET_KEY=your_jwt_secret_key
    ```

4.  **Start the server**:
    ```bash
    npm start
    ```
    The server will be running on `http://localhost:5001`.

### Frontend Setup

1.  **Navigate to the root directory**:
    ```bash
    cd .. 
    ```

2.  **Install dependencies**:
    ```bash
    npm install
    ```

3.  **Start the client**:
    ```bash
    npm run dev
    ```
    The application will be available at `http://localhost:5173`.

---

## How to Use

1.  Open the application in your browser at `http://localhost:5173`.
2.  Sign up for a new account using the form.
3.  Log in with your new credentials to access the dashboard.
