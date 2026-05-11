import type { Config } from "tailwindcss";
const config: Config = {
  content: ["./app/**/*.{ts,tsx}","./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        void:"#0A0A0F",surface:"#12121A",card:"#1A1A26",border:"#2A2A3E",
        accent:{cyan:"#00F5FF",purple:"#BF5AF2",gold:"#FFD60A",pink:"#FF2D78",green:"#30D158",orange:"#FF9F0A"},
        text:{primary:"#F0F0FF",secondary:"#8888AA",muted:"#4A4A6A"},
      },
      boxShadow:{
        "glow-cyan":"0 0 24px rgba(0,245,255,0.35),0 0 64px rgba(0,245,255,0.1)",
        "glow-purple":"0 0 24px rgba(191,90,242,0.35),0 0 64px rgba(191,90,242,0.1)",
        "glow-gold":"0 0 24px rgba(255,214,10,0.35),0 0 64px rgba(255,214,10,0.1)",
      },
    },
  },
  plugins: [],
};
export default config;
