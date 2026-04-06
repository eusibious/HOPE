# HOPE - Humanitarian Blockchain Network

A decentralized platform for transparent humanitarian aid distribution using blockchain technology and Firebase authentication.

![HOPE Logo](public/logo.png)

## 🌟 Features

### 🔐 Authentication & Security

- **Firebase Authentication** with email/password
- **Role-based access control** (Admin, Partner, User)
- **Email verification** for account security
- **Password reset functionality**
- **Protected routes** with React Router guards
- **Firestore security rules** for data protection

### 👑 Admin Panel

- **Campaign Management** - Create, edit, and monitor campaigns
- **Partner Request Management** - Review and approve partner applications
- **User Management** - Manage user roles and permissions
- **Analytics Dashboard** - View donation trends and campaign performance
- **Real-time Monitoring** - Live campaign status updates

### 💝 User Features

- **Campaign Discovery** - Browse and search humanitarian campaigns
- **Secure Donations** - Blockchain-powered donation system
- **Donation Tracking** - Real-time tracking of contributions
- **Aid Claims** - Apply for humanitarian assistance
- **Impact Reporting** - View the impact of your contributions

### 🏗️ Technical Features

- **React + Vite** - Modern development setup
- **Tailwind CSS** - Utility-first styling
- **Firebase Integration** - Authentication, Firestore, Hosting
- **Responsive Design** - Mobile-first approach
- **Development Tools** - Hot reload, emulators, debugging

## 🚀 Quick Start

### Prerequisites

- Node.js 18+ and npm
- Firebase CLI (optional, for emulators)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd HOPE
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env.local
   # Edit .env.local with your Firebase configuration
   ```

4. **Start development server**

   ```bash
   npm run dev
   ```

5. **Start Firebase emulators** (optional, for local development)
   ```bash
   npm run emulators
   ```

The app will be available at `http://localhost:5173`

## 🔧 Development

### Firebase Setup

For detailed Firebase setup instructions, see [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

#### Quick Firebase Setup

```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Start emulators
npm run emulators
```

### Available Scripts

```bash
# Development
npm run dev                 # Start development server
npm run emulators          # Start Firebase emulators
npm run emulators:auth     # Start Auth & Firestore emulators only

# Building
npm run build              # Build for production
npm run preview            # Preview production build

# Deployment
npm run deploy             # Build and deploy to Firebase
npm run deploy:hosting     # Deploy hosting only
npm run deploy:rules       # Deploy Firestore rules only

# Code Quality
npm run lint               # Run ESLint
```

### Environment Configuration

Create a `.env.local` file with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```

## 👤 User Management

### Creating the First Admin User

#### Option 1: Using the Application

1. Start the development server with emulators
2. Navigate to `/signup` in your browser
3. Create an account - the first user gets admin role automatically
4. Verify email using the link in browser console (emulator mode)

#### Option 2: Firebase Console (Production)

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a user in Authentication
3. Add user profile in Firestore with `role: "admin"`

### User Roles

- **Admin**: Full access to all features and admin panel
- **Partner**: Access to partner-specific features
- **User**: Standard user access for donations and aid claims

## 🏗️ Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── admin/          # Admin-specific components
│   ├── Button.jsx      # Button component
│   ├── Navbar.jsx      # Navigation component
│   ├── ProtectedRoute.jsx  # Route protection
│   └── ...
├── contexts/           # React contexts
│   ├── AuthContext.jsx # Authentication state
│   └── AdminContext.jsx # Admin state management
├── pages/              # Page components
│   ├── admin/          # Admin pages
│   ├── Home.jsx        # Landing page
│   ├── Login.jsx       # Login page
│   ├── SignUp.jsx      # Registration page
│   └── ...
├── services/           # External services
│   └── authService.js  # Firebase auth service
├── lib/                # Libraries and utilities
│   └── firebase.js     # Firebase configuration
└── utils/              # Utility functions
```

## 🔒 Security

### Authentication Security

- Email verification required
- Password complexity requirements
- Role-based access control
- Session management with Firebase

### Data Security

- Firestore security rules
- Client-side input validation
- Protected API endpoints
- Secure error handling

### Route Protection

```javascript
// Admin only routes
<AdminRoute>
  <AdminDashboard />
</AdminRoute>

// Public routes (redirect if authenticated)
<PublicRoute>
  <Login />
</PublicRoute>

// Protected routes (require authentication)
<ProtectedRoute>
  <UserDashboard />
</ProtectedRoute>
```

## 📱 Mobile Support

- Responsive design with Tailwind CSS
- Mobile-first approach
- Touch-friendly interfaces
- Progressive Web App ready

## 🚀 Deployment

### Firebase Hosting

1. **Build the application**

   ```bash
   npm run build
   ```

2. **Deploy to Firebase**

   ```bash
   npm run deploy
   ```

3. **Custom Domain** (optional)
   - Configure in Firebase Console
   - Update DNS settings
   - SSL automatically provided

### Environment-Specific Deployment

```bash
# Staging
firebase use staging
npm run deploy

# Production
firebase use production
npm run deploy
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes
4. Add tests for new functionality
5. Commit your changes: `git commit -m 'Add feature-name'`
6. Push to the branch: `git push origin feature-name`
7. Submit a pull request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update documentation as needed
- Use meaningful commit messages
- Ensure all tests pass before submitting

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

### Getting Help

1. Check the [FIREBASE_SETUP.md](FIREBASE_SETUP.md) for setup issues
2. Review the [Issues](../../issues) for known problems
3. Create a new issue for bugs or feature requests

### Common Issues

- **Firebase connection errors**: Check emulator status and ports
- **Authentication not working**: Verify Firebase config and emulators
- **Permission denied**: Check Firestore security rules and user roles
- **Build errors**: Ensure all dependencies are installed

### Resources

- [Firebase Documentation](https://firebase.google.com/docs)
- [React Documentation](https://react.dev)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com)

## 🏆 Acknowledgments

- Built with Firebase for authentication and data storage
- UI powered by Tailwind CSS and React
- Development optimized with Vite
- Humanitarian aid inspired by real-world needs

---

**Made with ❤️ for humanitarian causes**
