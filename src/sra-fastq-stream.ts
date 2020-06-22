import { Stream } from "stream";
import { spawn, ChildProcess } from "child_process";
import { FASTQ_DUMP_BIN } from "./util/env";
import logger from "./util/logger";

const ERR_INVALID_SRA_SNIPPET = "item not found while constructing within virtual database module";
const ERR_INVALID_SRA_CODE = 1000;

export default class FastqStream extends Stream {
    fastqDump: ChildProcess;
    static ERR_INVALID_SRA_CODE = ERR_INVALID_SRA_CODE;
    constructor(accession: string, numReads: number) {
        super();

        const params = [
            "-X",
            numReads.toString(),
            "-Z",
        ];

        const accessionSplit = accession.split(" ");
        if (accessionSplit.length === 1) {
            params.push(accession);
        } else {
            throw "sra-fastq-stream: accession contains unanticipated parameters";
        }

        this.fastqDump = spawn(FASTQ_DUMP_BIN, params);

        this.fastqDump.stdout.on("data", data => {
            this.emit("data", data);
        });

        this.fastqDump.stderr.on("data", data => {
            // prepend all lines with "fastq-dump: "
            const dataString: string = data.toString();
            const msg = dataString.split("\n").map(line => "fastq-dump: "+line).join("\n");
            logger.debug(msg);
            if (msg.includes(ERR_INVALID_SRA_SNIPPET)) {
                this.fastqDump.emit("close", ERR_INVALID_SRA_CODE);
            }
        });

        this.fastqDump.on("close", code => {
            if (code === 0) {
                this.emit("end", { "code": code, "message": "fastq-dump closed normally" });
            } else if (code === ERR_INVALID_SRA_CODE) {
                this.emit("error", { "code": code, "message": `No SRA record found for [${accession}]` });
            } else {
                this.emit("error", { "code": code, "message": "fastq-dump exited unexpectedly" });
            }
            this.fastqDump.removeAllListeners();
            this.fastqDump.kill();
            this.removeAllListeners();
        });
    }
}
