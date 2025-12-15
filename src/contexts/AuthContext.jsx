import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sign up with email, password, and username
  async function signup(email, password, username) {
    try {
      setError('');
      // Create the user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      // Create a document in the ToDoLists collection with username as document ID
      const userProfileData = {
        email: email,
        username: username,
        tasks: []
      };
      
      await setDoc(doc(db, 'ToDoLists', username), userProfileData);

      // Store username mapping for easy lookup
      await setDoc(doc(db, 'UserMappings', userCredential.user.uid), {
        username: username
      });

      // Immediately set the user profile so UI updates right away
      setUserProfile(userProfileData);

      return userCredential;
    } catch (err) {
      setError(getErrorMessage(err.code));
      throw err;
    }
  }

  // Sign in with email/username and password
  async function login(emailOrUsername, password) {
    try {
      setError('');
      
      let email = emailOrUsername;
      
      // Check if the input is a username (doesn't contain @)
      if (!emailOrUsername.includes('@')) {
        // Look up the email from the ToDoLists collection by username
        const userDoc = await getDoc(doc(db, 'ToDoLists', emailOrUsername));
        
        if (!userDoc.exists()) {
          setError('No account found with this username.');
          throw new Error('Username not found');
        }
        
        email = userDoc.data().email;
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      
      // Fetch and set the user profile immediately after login
      await fetchUserProfile(userCredential.user.uid);
      
      return userCredential;
    } catch (err) {
      if (err.message !== 'Username not found') {
        setError(getErrorMessage(err.code));
      }
      throw err;
    }
  }

  // Sign out
  async function logout() {
    try {
      setError('');
      await signOut(auth);
      setUserProfile(null);
    } catch (err) {
      setError(getErrorMessage(err.code));
      throw err;
    }
  }

  // Fetch user profile from Firestore
  async function fetchUserProfile(uid) {
    try {
      // First get the username from UserMappings
      const mappingDoc = await getDoc(doc(db, 'UserMappings', uid));
      if (mappingDoc.exists()) {
        const username = mappingDoc.data().username;
        // Then get the full profile from ToDoLists
        const profileDoc = await getDoc(doc(db, 'ToDoLists', username));
        if (profileDoc.exists()) {
          const profileData = profileDoc.data();
          setUserProfile(profileData);
          return profileData;
        }
      }
      return null;
    } catch (err) {
      console.error('Error fetching user profile:', err);
      return null;
    }
  }

  // Convert Firebase error codes to friendly messages
  function getErrorMessage(code) {
    switch (code) {
      case 'auth/email-already-in-use':
        return 'This email is already registered. Try signing in!';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/user-not-found':
        return 'No account found with this email or username.';
      case 'auth/wrong-password':
        return 'Incorrect password. Try again!';
      case 'auth/invalid-credential':
        return 'Invalid email/username or password. Please try again!';
      case 'auth/too-many-requests':
        return 'Too many attempts. Please wait a moment.';
      default:
        return 'Something went wrong. Please try again.';
    }
  }

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        // Only fetch if we don't already have the profile
        if (!userProfile) {
          await fetchUserProfile(user.uid);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const value = {
    currentUser,
    userProfile,
    loading,
    error,
    setError,
    signup,
    login,
    logout,
    fetchUserProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
