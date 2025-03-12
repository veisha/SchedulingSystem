'use client';

import Image from 'next/image';
import { TypeAnimation } from 'react-type-animation';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  // Redirect to /login after 5 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      router.push('/login');
    }, 5000); // 5 seconds delay

    return () => clearTimeout(timer); // Cleanup the timer
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white">
      {/* Welcome Image */}
      <div className="mb-8">
        <Image
          src="/welcome-image.png" // Replace with your image path
          alt="Welcome Image"
          width={200}
          height={200}
          className="rounded-lg shadow-lg"
          priority // Add this to prioritize the image
        />
      </div>

      {/* Typing Animation */}
      <div className="text-2xl font-bold text-gray-800">
        <TypeAnimation
          sequence={[
            'Welcome to Optimeet', // Text to display
            1000, // Delay after typing
            'Welcome to Optimeet.', // Add a dot
            1000, // Delay
            'Welcome to Optimeet..', // Add another dot
            1000, // Delay
            'Welcome to Optimeet...', // Add another dot
            1000, // Delay
          ]}
          wrapper="span"
          speed={50} // Typing speed
          repeat={Infinity} // Loop the animation
        />
      </div>
    </div>
  );
}