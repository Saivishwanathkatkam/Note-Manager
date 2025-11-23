
   ## About

   A lightweight Note Manager web application built with Node.js. Create, edit, and organise notes locally or deploy to a server. Designed for easy extension and integration.

   ## Features

   - Create, edit, and delete notes
   - Search and filter notes
   - Simple file or in-memory storage (configurable)
   - Minimal dependencies for quick startup

   ## Environment

   Create a `.env` file in the project root (if used by the app). Common variables:
   - MONGO_DB_SERVER_URI=http://localhost:5000
   - MONGO_DB_CONNECTION_URI=mongodb://localhost:27017

   Adjust according to your implementation.

   ## Available Scripts

   From the project root, run:

   - npm run dev — Start the development server with hot reload


   ## Deployment

   1. Ensure environment variables are set on the host.
   2. Install dependencies: npm install --production
   3. Start the server: npm run dev
   4. Use a process manager (pm2, systemd) or container orchestration for production reliability.

   ## Contributing

   1. Fork the repository.
   2. Create a branch: git checkout -b feature/your-feature
   3. Commit: git commit -m "Add feature"
   4. Push and open a pull request.

   Follow code style and include tests for new features.

   ## Troubleshooting

   - Port already in use: change PORT env var or stop other services.
   - Missing dependencies: run npm install.
   - Unexpected errors: check logs and ensure DATA_PATH is writable.

   ## Contact

   For issues or questions, open an issue in the repository.
