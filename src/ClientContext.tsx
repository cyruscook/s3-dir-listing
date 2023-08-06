import { createContext } from 'react';
import { S3Client } from "@aws-sdk/client-s3";

const ClientContext = createContext<S3Client | undefined>(undefined);
export default ClientContext;
