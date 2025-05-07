"use client";

import type { User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import type { UserProfile, UserRole } from '@/types';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import type { ReactNode } from 'react';
import React, { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, "users", user.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (userDocSnap.exists()) {
          const profileData = userDocSnap.data();
          // Ensure role is set, default to 'Secretary' if missing (e.g. for users created before role field or via other auth)
          // Registration form explicitly sets the role.
          setUserProfile({
            uid: user.uid,
            email: user.email,
            ...profileData,
            role: profileData.role || 'Secretary', // Default to Secretary if role is not set
          } as UserProfile);
        } else {
          // This case is for a new user, typically handled during registration.
          // If a user somehow authenticates without a profile (e.g. direct Firebase SDK auth), create a default Secretary profile.
          const newProfile: UserProfile = { 
            uid: user.uid, 
            email: user.email, 
            role: 'Secretary' // New users outside formal registration get Secretary role.
          };
          await setDoc(userDocRef, newProfile);
          setUserProfile(newProfile);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const logout = async () => {
    setLoading(true);
    await auth.signOut();
    setCurrentUser(null);
    setUserProfile(null);
    router.push('/login'); // Always redirect to login on logout
    setLoading(false);
  };
  
  const value = {
    currentUser,
    userProfile,
    loading,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

