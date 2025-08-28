'use client'
import React, { useEffect } from 'react'
import { useRouter } from 'next/navigation';

const page = () => {
      const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/');
    }, 3000);

    return () => clearTimeout(timer); // cleanup
  }, [router]);
  return (
    <div className="flex items-center justify-center h-screen bg-gray-100">
  <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center animate-fade-in">
    <h1 className="text-3xl font-bold text-gray-800 mb-4">Please Login</h1>
    <p className="text-gray-600">You’ll be redirected to the login page shortly...</p>
  </div>
</div>
  )
}

export default page