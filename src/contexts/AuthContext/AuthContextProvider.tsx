import {
  type PropsWithChildren,
  useCallback,
  useEffect,
  useState,
} from "react";
import AuthContext from "./AuthContext";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import { auth } from "../../firebase";
import usersServices from "../../services/usersServices";
import type AppUser from "../../models/AppUser";
import type UserDetails from "../../models/UserDetails";

const AuthContextProvider = ({ children }: PropsWithChildren) => {
  const [user, setUser] = useState<AppUser | null>(null);

  useEffect(() => {
    if (!user) return;

    const unsubscribe = usersServices.subscribeToUserDetails(
      (result) => {
        if (!result) {
          throw new Error("User details not found");
        }
        setUser((prev) => ({ ...prev, ...result } as AppUser));
      },
      (err) => {
        throw err;
      },
      user!.id
    );

    return () => unsubscribe();
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    const { user } = await signInWithEmailAndPassword(auth, email, password);

    try {
      const userDetails = await usersServices.getUserDetailsById(user.uid);

      if (!userDetails) throw new Error("User details not found.");

      setUser({
        id: user.uid,
        email,
        ...userDetails,
      } as AppUser);
    } catch (error) {
      await signOut(auth);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut(auth);
    setUser(null);
  }, []);

  const register = useCallback(
    async (newUser: Omit<AppUser, "id"> & { password: string }) => {
      const { email, password, ...userDetails } = newUser;

      const { user } = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );

      try {
        await usersServices.createUserDetails(
          user.uid,
          userDetails as UserDetails
        );

        setUser({
          id: user.uid,
          email,
          ...userDetails,
        } as AppUser);
      } catch (error) {
        await auth.currentUser?.delete();
        throw error;
      }
    },
    []
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContextProvider;
