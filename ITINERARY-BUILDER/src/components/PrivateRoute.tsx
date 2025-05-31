import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../components/supabaseConfig"

const PrivateRoute = ({ children }: { children: JSX.Element }) => {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setAuthenticated(!!user);
    };

    checkAuth();
  }, []);

  if (authenticated === null) return <div>Loading...</div>;

  return authenticated ? children : <Navigate to="/LoginPage" replace />;
};

export default PrivateRoute;
