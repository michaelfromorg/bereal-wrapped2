// app/page.tsx
"use client";

import { useState } from "react";
import { AuthForm } from "@/components/auth-form";
import { VideoGenerator } from "@/components/video-generator";
import { berealClient } from "@/lib/bereal";

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const handleAuthentication = (token: string) => {
    // Initialize BeReal client with token
    berealClient.setToken(token);
    setIsAuthenticated(true);
  };

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-4">
            BeReal, Wrapped
          </h1>
          <p className="text-lg text-gray-400 mb-8">
            Generate a video recap of your BeReal memories
          </p>
        </div>

        <div className="flex justify-center">
          {!isAuthenticated ? (
            <AuthForm onAuthenticated={handleAuthentication} />
          ) : (
            <VideoGenerator />
          )}
        </div>

        <div className="mt-12 text-center text-sm text-gray-500">
          <p>
            Your data never leaves your browser. All processing is done locally.
          </p>
        </div>
      </div>
    </div>
  );
}
