import Head from "next/head";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import Features from "../components/Features";
import Download from "../components/Download";
import Footer from "../components/Footer";

export default function Home() {
  return (
    <>
      <Head>
        <title>Window Snap Pro — Snap Windows. Stay Focused.</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <div className="min-h-screen bg-white dark:bg-[#0a0a0a] transition-colors duration-300">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <Download />
        </main>
        <Footer />
      </div>
    </>
  );
}
