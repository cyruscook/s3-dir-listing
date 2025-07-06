import { createStorageBrowser, CreateStorageBrowserInput } from '@aws-amplify/ui-react-storage/browser';
import { STSClient, GetCallerIdentityCommand, GetSessionTokenCommand } from "@aws-sdk/client-sts";
import '@aws-amplify/ui-react-storage/styles.css';
import { Suspense, use } from 'react';

type CredentialsProvider = CreateStorageBrowserInput['config']['getLocationCredentials'];

const getAccountId = async (stsClient: STSClient): Promise<string> => {
    const command = new GetCallerIdentityCommand({});
    const data = await stsClient.send(command);
    if (data.Account === undefined) {
        throw new Error("undefined account");
    }
    return data.Account;
}

function InnerBucketList(props: { stsClient: STSClient, bucket: string, readonly: boolean, region: string, accessKeyId: string, secretAccessKey: string, accountIdPromise: Promise<string> }) {
    const accountId = use(props.accountIdPromise);
    const credentialsProvider: CredentialsProvider = async () => {
        const command = new GetSessionTokenCommand({
            DurationSeconds: 60 * 60
        })
        const data = await props.stsClient.send(command);
        const newCreds = data.Credentials;
        if (newCreds !== undefined && newCreds.AccessKeyId !== undefined && newCreds.SecretAccessKey !== undefined && newCreds.SessionToken !== undefined && newCreds.Expiration !== undefined) {
            const outCreds = {
                accessKeyId: newCreds.AccessKeyId,
                secretAccessKey: newCreds.SecretAccessKey,
                sessionToken: newCreds.SessionToken,
                expiration: newCreds.Expiration,
            };
            return {
                credentials: outCreds
            };
        } else {
            throw new Error("Bad creds");
        }
    };

    const { StorageBrowser } = createStorageBrowser({
        config: {
            accountId: accountId,
            getLocationCredentials: credentialsProvider,
            region: props.region,
            listLocations: async (_input = {}) => {
                return {
                    items: [
                        {
                            bucket: props.bucket,
                            prefix: '', // empty path means bucket root
                            id: props.bucket, // unique identifier 
                            type: 'BUCKET',
                            permissions: props.readonly ? ['get', 'list'] : ['delete', 'get', 'list', 'write'],
                        },
                    ],
                    nextToken: undefined,
                }
            },
            registerAuthListener: () => { }
        }
    });

    return <StorageBrowser />;
}

export default function AmplifyBucketList(props: { bucket: string, readonly: boolean, region: string, accessKeyId: string, secretAccessKey: string }) {
    const stsClient = new STSClient({
        region: props.region,
        credentials: {
            accessKeyId: props.accessKeyId,
            secretAccessKey: props.secretAccessKey,
        },
    });
    const accountIdPromise = getAccountId(stsClient);

    return <Suspense fallback={<p>Loading...</p>}>
        <InnerBucketList stsClient={stsClient} bucket={props.bucket} readonly={props.readonly} region={props.region} accessKeyId={props.accessKeyId} secretAccessKey={props.secretAccessKey} accountIdPromise={accountIdPromise} />
    </Suspense>
}
