# CyberPiT Backend

Node.js/Express backend API for CyberPiT Inc. cybersecurity website.

## 🚀 Tech Stack

- **Node.js** with Express.js
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **JWT** for authentication
- **Brevo** for email services
- **Multer** for file uploads
- **Helmet** for security
- **CORS** for cross-origin requests

## 📁 Project Structure

```
src/
├── config/             # Database and configuration
├── models/             # MongoDB/Mongoose models
├── routes/             # API route handlers
├── services/           # Business logic services
├── middleware/         # Custom middleware
└── server.ts           # Main server file
```

## 🛠️ Installation & Setup

### Prerequisites
- Node.js (v18 or higher)
- MongoDB (local or MongoDB Atlas)
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/Arittroskr32/CyberPiT_backend.git
cd CyberPiT_backend
```

2. **Install dependencies**
```bash
npm install
```

3. **Set up environment variables**
Copy `.env.example` to `.env` and update the values:
```bash
cp .env.example .env
```

4. **Start development server**
```bash
npm run dev
```

The API will be available at http://localhost:5001

## 📜 Available Scripts

- `npm run dev` - Start development server with nodemon
- `npm run build` - Build TypeScript to JavaScript
- `npm start` - Start production server
- `npm run setup` - Set up initial admin user

## 🌐 Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `DATABASE_URL` | MongoDB connection string | `mongodb://localhost:27017/cyberpit` |
| `JWT_SECRET` | Secret key for JWT tokens | `your-super-secret-key` |
| `PORT` | Server port | `5001` |
| `FRONTEND_URL` | Frontend URL for CORS | `http://localhost:5173` |
| `BREVO_API_KEY` | Brevo email service API key | `your-brevo-api-key` |
| `ADMIN_EMAIL` | Default admin email | `admin@yourdomain.com` |
| `ADMIN_PASSWORD` | Default admin password | `your-admin-password` |

## 🔌 API Endpoints

### Authentication
- `POST /api/auth/login` - Admin login
- `POST /api/auth/verify` - Verify JWT token

### Admin Management
- `GET /api/admin/stats` - Get dashboard statistics
- `POST /api/admin/setup` - Initial admin setup

### Content Management
- `GET /api/contact` - Get contact messages
- `POST /api/contact` - Submit contact form
- `GET /api/subscriptions` - Get newsletter subscriptions
- `POST /api/subscriptions` - Subscribe to newsletter
- `GET /api/team` - Get team applications
- `POST /api/team` - Submit team application
- `GET /api/projects` - Get projects
- `POST /api/projects` - Create project
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### File Management
- `GET /api/videos` - Get videos
- `POST /api/videos/upload` - Upload video
- `DELETE /api/videos/:id` - Delete video

### Feedback & Reports
- `GET /api/feedback` - Get feedback
- `POST /api/feedback` - Submit feedback
- `GET /api/reports` - Get security reports
- `POST /api/reports` - Submit security report

## 🗃️ Database Models

### Admin
- Email, password (hashed)
- Role-based access control

### Contact
- Name, email, subject, message
- Timestamp, read status

### Subscription
- Email, subscription date
- Active status

### TeamApplication
- Personal info, skills, experience
- Application status

### Project
- Title, description, technologies
- Images, links, featured status

### Video
- Filename, original name, file size
- Device type (mobile/desktop)

### Feedback
- Name, email, rating, message
- Approval status

### Report
- Reporter info, vulnerability details
- Severity level, status

## 🔐 Authentication

The API uses JWT (JSON Web Tokens) for authentication:

1. **Login**: POST to `/api/auth/login` with email/password
2. **Token**: Receive JWT token in response
3. **Authorization**: Include token in `Authorization: Bearer <token>` header
4. **Protected Routes**: Admin routes require valid JWT token

## 📧 Email Service

Uses Brevo (formerly Sendinblue) for email notifications:
- Contact form submissions
- Newsletter subscriptions
- Admin notifications

## 📤 File Upload

Supports file uploads with:
- Size limit: 150MB (configurable)
- Supported formats: MP4 for videos
- Storage: Local filesystem (`uploads/` directory)

## 🛡️ Security Features

- **Helmet.js** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - Prevents abuse
- **Input Validation** - Data sanitization
- **Password Hashing** - Bcrypt encryption
- **JWT Tokens** - Secure authentication

## 🚀 Deployment

### Environment Setup
1. Set `NODE_ENV=production`
2. Configure production database URL
3. Set secure JWT secret
4. Configure email service
5. Set proper CORS origins

### Build & Start
```bash
npm run build
npm start
```

## 🔗 Frontend Repository

This backend serves the CyberPiT React frontend:
**https://github.com/Arittroskr32/CyberPiT_frontend**

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

MIT License - see LICENSE file for details

## 📞 Support

For support, email administrator@cyberpit.live or create an issue in this repository.
