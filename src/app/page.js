"use client"

import Image from "next/image";
import { redirect } from "next/navigation";
import { useEffect } from "react";
import 'react-toastify/dist/ReactToastify.css';


export default function Home() {
  useEffect(()=>{
    redirect('/home')
  })
  return <div></div>;
}
