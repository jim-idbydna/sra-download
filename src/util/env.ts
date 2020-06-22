import logger from "./logger";
import dotenv from "dotenv";
import fs from "fs-extra";

if (fs.existsSync(".env")) {
    logger.debug("Using .env file to supply config environment variables");
    dotenv.config({ path: ".env" });
}

export const FASTQ_STORAGE_DIR = process.env["FASTQ_STORAGE_DIR"];
export const RESULT_API_ENDPOINT = process.env["RESULT_API_ENDPOINT"];
export const FASTQ_DUMP_BIN = process.env["FASTQ_DUMP_BIN"];
export const PORT = process.env["PORT"];

if (!FASTQ_STORAGE_DIR) {
    logger.error("No fastq storage directory. Set FASTQ_STORAGE_DIR environment variable.");
    process.exit(1);
}

if (!RESULT_API_ENDPOINT) {
    logger.error("No result API endpoint set. Set RESULT_API_ENDPOINT environment variable.");
    process.exit(1);
}

if (!FASTQ_DUMP_BIN) {
    logger.error("No fastq-dump binary path set. Set FASTQ_DUMP_BIN environment variable.");
    process.exit(1);
}

fs.ensureDirSync(FASTQ_STORAGE_DIR);
