import type { NextConfig } from "next";
import { validateEnv } from "./lib/env";

validateEnv();

const nextConfig: NextConfig = {};

export default nextConfig;
