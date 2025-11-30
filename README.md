# Tutor Support System

## Project Implementation Concept

The **Tutor Support System** is developed based on the detailed designs and specifications outlined in the project requirements. Our goal is to create a user-friendly and intuitive web platform serving three main user groups: **Students**, **Tutors**, and **Coordinators (Admins)**.

### Technology & Architecture

The system follows a standard **Client-Server** model, optimized for a course project environment:

#### 1. Client-Side (Frontend)
* **Core Technologies:** Built entirely using standard **HTML**, **CSS**, and **JavaScript**.
* **Structure:** The user interface is divided into distinct pages (e.g., `login.html`, `course.html`, `admin/dashboard.html`).
* **Modularity:** Each page is accompanied by its own CSS file for styling and a JavaScript file to handle client-side logic (user interaction, data validation, API calls, etc.). This makes the source code modular and easy to manage.

#### 2. Server-Side (Backend) & Data Storage
To meet the requirement of using a file system for data storage instead of a traditional database management system (DBMS), the team utilized **Node.js** with the **Express.js** framework.

* **JSON File System (Data Persistence):**
    * All application data (students, courses, reports, etc.) is stored in `.json` files located in the `/data` directory.
    * Each file acts as a "table". For example, `stu.json` stores the student list, and `courses.json` stores course details.

* **Node.js & Express.js Server:**
    * **Express.js:** A minimal framework used to set up the local web server and define API endpoints. It utilizes `cors` to allow resource sharing during local development.
    * **File System (`fs`) Module:** A built-in Node.js module used by the backend to securely read from and write to the JSON files, ensuring controlled data interaction between the frontend and the file system.

---

## How to run

Follow these instructions to set up and run the project on your local machine.

### Prerequisites
* **Node.js**: Ensure Node.js is installed on your computer.
    * [Download Node.js here](https://nodejs.org/en/download) (Install with default settings).

### Installation & Hosting

1.  **Install Dependencies**:
    Open your terminal/command prompt in the project root directory and run the following command to install the libraries defined in `package.json`:
    ```bash
    npm install
    ```

2.  **Start the Server**:
    Run the following command to host the Node.js server (this executes the `server.js` file):
    ```bash
    node server.js
    ```

3.  **Access the Application**:
    Once the server is running, open your web browser and navigate to:
    [http://localhost:5500](http://localhost:5500)
