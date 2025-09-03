import {
  collection,
  doc,
  FirestoreError,
  getDoc,
  onSnapshot,
  setDoc,
  type Unsubscribe,
} from "firebase/firestore";
import { database } from "../firebase";
import type UserDetails from "../models/UserDetails";

export const USERS_COLLECTION = collection(database, "users");

const usersServices = {
  getUserDetailsById: async (
    userId: string
  ): Promise<UserDetails | undefined> => {
    const docRef = doc(USERS_COLLECTION, userId);

    const snapshot = await getDoc(docRef);

    return snapshot.exists()
      ? ({ ...snapshot.data() } as UserDetails)
      : undefined;
  },
  createUserDetails: (
    userId: string,
    userDetails: UserDetails
  ): Promise<void> => {
    const docRef = doc(USERS_COLLECTION, userId);
    return setDoc(docRef, userDetails);
  },
  subscribeToUserDetails: (
    onSuccess: (result: UserDetails | undefined) => void,
    onFailure: (error: FirestoreError) => void,
    userId: string
  ): Unsubscribe => {
    const docRef = doc(USERS_COLLECTION, userId);

    return onSnapshot(
      docRef,
      (snapshot) => {
        const result = snapshot.exists()
          ? ({ ...snapshot.data() } as UserDetails)
          : undefined;

        onSuccess(result);
      },
      onFailure
    );
  },
};

export default usersServices;
