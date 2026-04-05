export const getFirebaseAuthErrorMessage = (code) => {
  switch (code) {
    case "auth/user-not-found":
      return "No account found with this email.";

    case "auth/wrong-password":
      return "Incorrect password.";

    case "auth/invalid-email":
      return "Invalid email address.";

    case "auth/too-many-requests":
      return "Too many login attempts. Try again later.";

    default:
      return "Login failed. Please try again.";
  }
};


