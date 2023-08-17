import { Client } from "minio";

const host = process.env.MINIO_HOST || "minio";
const port = process.env.MINIO_PORT || 9000;
const accessKey = process.env.MINIO_ACCESS_KEY;
const secretKey = process.env.MINIO_SECRET_KEY;

if (!secretKey || !accessKey)
    throw new Error("Minio access or secret key are not specified. Provide appropriate environment variables.");

const minioClient = new Client({
    endPoint: host,
    port,
    useSSL: false,
    accessKey,
    secretKey
});

export default minioClient;
