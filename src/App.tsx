import { ErrorBoundary } from "react-error-boundary";
import { S3Client } from "@aws-sdk/client-s3";
import ClientContext from "./ClientContext.tsx";
import BucketList from "./BucketList.tsx";
import "./App.css";

export default function App() {
	const queryParameters = new URLSearchParams(window.location.search);
	const region = queryParameters.get("region");
	const accessKeyId = queryParameters.get("accessKeyId");
	const secretAccessKey = queryParameters.get("secretAccessKey");
	const bucket = queryParameters.get("bucket");
	if (region === null) {
		return (
			<p>Please provide the "region" query parameter with the S3 bucket's region.</p>
		);
	}
	if (accessKeyId === null || secretAccessKey === null || bucket === null) {
		return (
			<p>Please provide the "accessKeyId" and "secretAccessKey" query parameters with the AWS credentials.</p>
		);
	}
	if (bucket === null) {
		return (
			<p>Please provide the "bucket" query parameter with the S3 bucket name.</p>
		);
	}

	const client = new S3Client({
		region: region,
		credentials: {
			accessKeyId: accessKeyId,
			secretAccessKey: secretAccessKey,
		},
	});

	function fallbackRender(props: { error: { message: string } }) {
		console.error(props.error);
		return (
			<div role="alert">
				<p>Something went wrong:</p>
				<pre style={{ color: "red" }}>{props.error.message}</pre>
			</div>
		);
	}

	return (
		<ClientContext.Provider value={client}>
			<ErrorBoundary fallbackRender={fallbackRender}>
				<div className="App">
					<BucketList bucket={bucket} />
				</div>
			</ErrorBoundary>
		</ClientContext.Provider>
	);
}
