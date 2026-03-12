# Contributing To Kshitij Capstone

Welcome! This guide will help your team members get started with the project and understand how to contribute code effectively.

## 1. Local Setup

To get the project running on your own machine, follow these steps:

1.  **Clone the Repository**:
    ```bash
    git clone https://github.com/kshitijdalvi4/Capstone_Phase2.git
    cd Capstone_Phase2
    ```

2.  **Install Dependencies**:
    ```bash
    # Root directory (Frontend)
    npm install
    
    # Auth server directory
    cd server
    npm install
    cd ..
    ```

3.  **Setup Environment Variables**:
    *   Create a `.env` file in the `server` directory (for MongoDB/Secret keys).
    *   Create a `.env` file in `backend_rag` for your Google API Key.

4.  **Run the Project**:
    *   **Frontend**: `npm run dev` (Runs on http://localhost:5173)
    *   **Python Backend**: Run `start_backend.bat` or `python backend_rag/main.py`.

---

## 2. Making Changes as a Teammate (Collaborator)

If you are part of the main development team and have write access to the repository, follow this **Branching Workflow**:

1.  **Pull latest changes**: Always start with `git pull origin main`.
2.  **Create a feature branch**: Give it a descriptive name.
    ```bash
    git checkout -b feature/new-ui-style
    ```
3.  **Make your changes and commit**:
    ```bash
    git add .
    git commit -m "Refactored the side navigation for better UX"
    ```
4.  **Push to GitHub**:
    ```bash
    git push origin feature/new-ui-style
    ```
5.  **Open a Pull Request (PR)**: Go to the GitHub repository page and click "Compare & pull request". Tag a teammate for review.

---

## 3. Making Changes as a Contributor (External/Fork Workflow)

If you don't have direct write access (or prefer a cleaner separation), use the **Forking Workflow**:

1.  **Fork the Project**: Click the "Fork" button on the top-right of the GitHub page.
2.  **Clone your Fork**: `git clone https://github.com/YOUR_USERNAME/Capstone_Phase2.git`
3.  **Create a Branch**: `git checkout -b contribution/my-fix`
4.  **Commit and Push** to your fork.
5.  **Open a Pull Request**: On the original repository, click "New Pull Request" and select "compare across forks".

---

## Best Practices
- **Never push directly to `main`**: Always use branches and Pull Requests.
- **Run Linting**: Run `npm run lint` before committing.
- **Descriptive Commits**: Make your commit messages clear and present tense (e.g., "Add login validation" instead of "Fixed the thing").
