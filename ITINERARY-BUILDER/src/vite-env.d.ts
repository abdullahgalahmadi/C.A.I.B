/// <reference types="vite/client" />
declare module "*.png";
declare module "*.svg";
declare module "*.jpeg";
declare module "*.jpg";

/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_GEMINI_API_KEY: string;
  }
  
  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
  