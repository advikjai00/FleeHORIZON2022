import React from "react";
import {ReactNode} from "react";
import Navbar from "./Navbar";

interface Prop {
    children?: ReactNode;
}

const Layout = ({children}: Prop) => {
  return (
    <div className="bg-black text-white">
      <Navbar />
      {children}
    </div>
  );
};

export default Layout;