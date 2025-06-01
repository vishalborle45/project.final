import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

const Home = () => {
  return (
    <section className="flex flex-col md:flex-row items-center justify-between px-6 py-12 gap-10 bg-background container mx-auto">
      <div className="max-w-lg space-y-6 text-center md:text-left">
        <h1 className="text-4xl font-bold leading-tight">
          Welcome to D-App
        </h1>
        <p className="text-muted-foreground">
          A Secure documet storage application with end-to-end encryption and fast transactions with solana blockchain.
        </p>
        <div className="space-x-4">
          <Link to="/register">
            <Button size="lg">Get Started</Button>
          </Link>
          <Link to="/login">
            <Button size="lg" variant="outline">
              Login
            </Button>
          </Link>
        </div>
      </div>
      <img
        src="./hero2.jpg"
        alt="Hero"
        className="rounded-xl shadow-xl w-full max-w-md"
      />
    </section>
  );
};

export default Home;
