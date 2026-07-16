"use client";
import MainButton from "@/components/commonComponents/MainButton";
import { motion } from "motion/react";
import Image from "next/image";

export default function Home() {
  return (
    <div
      id="mainContainer"
      className="relative flex flex-col justify-center items-center mx-auto min-h-screen text-center text-white border"
    >
      <Image
        src="/bgImage/backgroundimage.webp"
        alt=""
        fill
        priority
        className="object-cover -z-10 blur-sm brightness-30"
        sizes="100vw"
      />

      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true, amount: 0.3 }}
        className="flex flex-col xl:w-1/2 items-center mx-auto text-center text-white"
      >
        <p className="libre-font text-[40px] xl:text-[60px] leading-10 xl:leading-14 mb-14 font-light tracking-tighter">
          Planning a <span className="italic">wedding</span> have never been
          easier, until now
        </p>
        <p className="text-[20px] w-3/4 leading-7 mb-8 opacity-50 font-light tracking-tight">
          Describe your wedding. Choose freely from over 10,000+ wedding
          vendors, tailored exactly to your liking
        </p>
        <div className="mb-2 opacity-50 hover:opacity-100 text-black">
          <MainButton href="/weddingplan">Start Planning</MainButton>
        </div>
        <p className="opacity-50">6 Categories - Takes about 5 minutes</p>
      </motion.div>
    </div>
  );
}
