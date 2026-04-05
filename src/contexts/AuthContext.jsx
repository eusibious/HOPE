import { createContext, useContext, useReducer, useEffect } from "react";
import {
  signInUser,
  submitPartnerApplication as submitPartnerApplicationService,
  signOutUser,
  onAuthStateChange,
  getUserData,
} from "../services/authService";

const AuthContext = createContext();

const AUTH_ACTIONS = {
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGOUT: "LOGOUT",
  SET_LOADING: "SET_LOADING",
};

function authReducer(state, action) {
  switch (action.type) {
    case AUTH_ACTIONS.LOGIN_SUCCESS:
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        userData: action.payload.userData,
        role: action.payload.userData?.role || null,
        loading: false,
      };
    case AUTH_ACTIONS.LOGOUT:
      return {
        ...state,
        isAuthenticated: false,
        user: null,
        userData: null,
        role: null,
        loading: false,
      };
    case AUTH_ACTIONS.SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };
    default:
      return state;
  }
}

const initialState = {
  isAuthenticated: false,
  user: null,
  userData: null,
  role: null,
  loading: true,
};

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Listen to Firebase auth state changes
  // This handles session restore on page refresh and post-login state update
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (user) => {
      if (user) {
        const userData = await getUserData(user.uid);
        // Treat sessions without a valid role profile as logged out for role-gated flows.
        if (!userData || userData.role == null) {
          dispatch({ type: AUTH_ACTIONS.LOGOUT });
          return;
        }

        dispatch({
          type: AUTH_ACTIONS.LOGIN_SUCCESS,
          payload: { user, userData },
        });
      } else {
        dispatch({ type: AUTH_ACTIONS.LOGOUT });
      }
    });

    return () => unsubscribe();
  }, []);

  // Login — works for both admins (role: 1) and partners (role: 2)
  // Auth state listener above handles the state update after success
  const login = async ({ email, password }) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

    try {
      const result = await signInUser(email, password);
      if (!result.success) {
        return result;
      }
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "Login failed. Please try again.",
      };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Submit partner application — stores to `partner-requests`, no user created
  // Account creation is handled automatically by the Cloud Function after admin approval
  const submitPartnerApplication = async (partnerData) => {
    dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: true });

    try {
      const result = await submitPartnerApplicationService(partnerData);
      return result;
    } catch (error) {
      return {
        success: false,
        error: "Application submission failed. Please try again.",
      };
    } finally {
      dispatch({ type: AUTH_ACTIONS.SET_LOADING, payload: false });
    }
  };

  // Logout — auth state listener handles clearing the state
  const logout = async () => {
    try {
      await signOutUser();
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  // Role check helper — compares as strings to handle any type inconsistency
  // Usage: hasRole(1) → admin, hasRole(2) → partner
  const hasRole = (requiredRole) => {
    if (!state.isAuthenticated || state.role == null) {
      return false;
    }
    return String(state.role) === String(requiredRole);
  };

  const value = {
    ...state,
    login,
    submitPartnerApplication,
    logout,
    hasRole,
  };

  return (
    <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;