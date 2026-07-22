import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";


interface ProtectedRouteProps {

  children: React.ReactNode;

}



export default function ProtectedRoute({
  children,
}: ProtectedRouteProps) {


  const {
    user,
    loading
  } = useAuth();



  if (loading) {

    return (

      <div
        style={{
          color:"#fff",
          background:"#020617",
          minHeight:"100vh",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          fontSize:"24px"
        }}
      >

        Loading...

      </div>

    );

  }



  if (!user) {

    return (

      <Navigate
        to="/login"
        replace
      />

    );

  }



  return (

    <>

      {children}

    </>

  );

}