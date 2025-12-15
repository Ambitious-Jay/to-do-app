import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';

const AuthContext = createContext();

// Task status constants
export const TASK_STATUS = {
  UNWHACKED: 'unwhacked',
  IN_WHACKING: 'in-whacking',
  WHACKED: 'whacked'
};

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
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      const userProfileData = {
        email: email,
        username: username,
        gardens: []
      };
      
      await setDoc(doc(db, 'ToDoLists', username), userProfileData);

      await setDoc(doc(db, 'UserMappings', userCredential.user.uid), {
        username: username
      });

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
      
      if (!emailOrUsername.includes('@')) {
        const userDoc = await getDoc(doc(db, 'ToDoLists', emailOrUsername));
        
        if (!userDoc.exists()) {
          setError('No account found with this username.');
          throw new Error('Username not found');
        }
        
        email = userDoc.data().email;
      }
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
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
      const mappingDoc = await getDoc(doc(db, 'UserMappings', uid));
      if (mappingDoc.exists()) {
        const username = mappingDoc.data().username;
        const profileDoc = await getDoc(doc(db, 'ToDoLists', username));
        if (profileDoc.exists()) {
          let profileData = profileDoc.data();
          
          // Migration: Convert old tasks array to gardens if needed
          if (profileData.tasks && !profileData.gardens) {
            profileData.gardens = [];
            await updateDoc(doc(db, 'ToDoLists', username), {
              gardens: [],
              tasks: []
            });
          }
          
          // Ensure gardens exists
          if (!profileData.gardens) {
            profileData.gardens = [];
          }
          
          // Migration: Ensure all tasks have required fields
          let needsMigration = false;
          profileData.gardens = profileData.gardens.map(garden => ({
            ...garden,
            tasks: garden.tasks.map(task => {
              let updatedTask = { ...task };
              
              // Convert old completed boolean to status
              if (task.completed !== undefined && !task.status) {
                needsMigration = true;
                updatedTask.status = task.completed ? TASK_STATUS.WHACKED : TASK_STATUS.UNWHACKED;
              }
              
              // Ensure status exists
              if (!updatedTask.status) {
                needsMigration = true;
                updatedTask.status = TASK_STATUS.UNWHACKED;
              }
              
              // Ensure dueDate exists (null is fine)
              if (updatedTask.dueDate === undefined) {
                needsMigration = true;
                updatedTask.dueDate = null;
              }
              
              return updatedTask;
            })
          }));
          
          if (needsMigration) {
            await updateDoc(doc(db, 'ToDoLists', username), {
              gardens: profileData.gardens
            });
          }
          
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

  // Add a new garden (returns updated gardens array)
  async function addGarden(gardenName) {
    if (!userProfile) return null;
    
    try {
      const newGarden = {
        name: gardenName,
        tasks: []
      };
      
      const updatedGardens = [...(userProfile.gardens || []), newGarden];
      
      await updateDoc(doc(db, 'ToDoLists', userProfile.username), {
        gardens: updatedGardens
      });
      
      setUserProfile(prev => ({
        ...prev,
        gardens: updatedGardens
      }));
      
      return updatedGardens;
    } catch (err) {
      console.error('Error adding garden:', err);
      throw err;
    }
  }

  // Add a task to a garden (with optional gardens array override)
  async function addTask(gardenName, taskName, taskDescription, dueDate = null, gardensOverride = null) {
    if (!userProfile) return;
    
    try {
      const newTask = {
        id: Date.now().toString(),
        name: taskName,
        description: taskDescription,
        status: TASK_STATUS.UNWHACKED,
        dueDate: dueDate,
        createdAt: new Date().toISOString()
      };
      
      const currentGardens = gardensOverride || userProfile.gardens || [];
      
      const updatedGardens = currentGardens.map(garden => {
        if (garden.name === gardenName) {
          return {
            ...garden,
            tasks: [...garden.tasks, newTask]
          };
        }
        return garden;
      });
      
      await updateDoc(doc(db, 'ToDoLists', userProfile.username), {
        gardens: updatedGardens
      });
      
      setUserProfile(prev => ({
        ...prev,
        gardens: updatedGardens
      }));
      
      return newTask;
    } catch (err) {
      console.error('Error adding task:', err);
      throw err;
    }
  }

  // Update a task (for editing)
  async function updateTask(gardenName, taskId, updates) {
    if (!userProfile) return;
    
    try {
      const updatedGardens = (userProfile.gardens || []).map(garden => {
        if (garden.name === gardenName) {
          return {
            ...garden,
            tasks: garden.tasks.map(task => {
              if (task.id === taskId) {
                return { ...task, ...updates };
              }
              return task;
            })
          };
        }
        return garden;
      });
      
      await updateDoc(doc(db, 'ToDoLists', userProfile.username), {
        gardens: updatedGardens
      });
      
      setUserProfile(prev => ({
        ...prev,
        gardens: updatedGardens
      }));
    } catch (err) {
      console.error('Error updating task:', err);
      throw err;
    }
  }

  // Delete a task
  async function deleteTask(gardenName, taskId) {
    if (!userProfile) return;
    
    try {
      const updatedGardens = (userProfile.gardens || []).map(garden => {
        if (garden.name === gardenName) {
          return {
            ...garden,
            tasks: garden.tasks.filter(task => task.id !== taskId)
          };
        }
        return garden;
      });
      
      await updateDoc(doc(db, 'ToDoLists', userProfile.username), {
        gardens: updatedGardens
      });
      
      setUserProfile(prev => ({
        ...prev,
        gardens: updatedGardens
      }));
    } catch (err) {
      console.error('Error deleting task:', err);
      throw err;
    }
  }

  // Delete a garden
  async function deleteGarden(gardenName) {
    if (!userProfile) return;
    
    try {
      const updatedGardens = (userProfile.gardens || []).filter(
        garden => garden.name !== gardenName
      );
      
      await updateDoc(doc(db, 'ToDoLists', userProfile.username), {
        gardens: updatedGardens
      });
      
      setUserProfile(prev => ({
        ...prev,
        gardens: updatedGardens
      }));
    } catch (err) {
      console.error('Error deleting garden:', err);
      throw err;
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
    fetchUserProfile,
    addGarden,
    addTask,
    updateTask,
    deleteTask,
    deleteGarden
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
