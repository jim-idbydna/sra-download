import axios from "axios";
import express from "express";
import compression from "compression";  // compresses requests
import bodyParser from "body-parser";
import { createWriteStream } from "fs";
import path from "path";
import FastqStream from "./sra-fastq-stream";
import logger from "./util/logger";
import { FASTQ_STORAGE_DIR, RESULT_API_ENDPOINT, PORT } from "./util/env";

// Create Express server
const app = express();

// Express configuration
app.set("port", PORT || 3000);
app.use(compression());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/data", (req, res) => {
    const outputFilePath = path.join(FASTQ_STORAGE_DIR, `${req.body.id}.fastq`);
    logger.info(`Fetching ${req.body.sraId} to ${outputFilePath}`);
    const writeStream = createWriteStream(outputFilePath);
    const fastqStream = new FastqStream(req.body.sraId, 10000000);
    fastqStream.pipe(writeStream);
    res.sendStatus(201);
    writeStream.on("finish", () => {
        logger.info(`Finished writing to ${outputFilePath}`);
        const data = {
            message: "fastq",
            id: req.body.id,
            dataLocation: outputFilePath,
        };
        axios.post(RESULT_API_ENDPOINT, data).catch(err => {
            logger.error(err);
        });
    });
    const handleError = (err: Error) => {
        logger.error(err);
        const data = {
            message: "error",
            id: req.body.id,
        };
        axios.post(RESULT_API_ENDPOINT, data).catch(err => {
            logger.error(err);
        });
    };
    fastqStream.on("error", handleError);
    writeStream.on("error", handleError);
});

export default app;
