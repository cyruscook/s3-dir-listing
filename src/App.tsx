import { ErrorBoundary } from "react-error-boundary";
import { S3Client } from "@aws-sdk/client-s3";
import ClientContext from "./ClientContext.tsx";
import BucketList from "./BucketList.tsx";
import InputForm from "./InputForm.tsx";
import "./App.css";

export default function App() {
	function fallbackRender(props: { error: { message: string } }) {
		console.error(props.error);
		return (
			<div role="alert">
				<p>Something went wrong:</p>
				<pre style={{ color: "red" }}>{props.error.message}</pre>
			</div>
		);
	}

	const queryParameters = new URLSearchParams(window.location.search);
	const region = queryParameters.get("region");
	const accessKeyId = queryParameters.get("accessKeyId");
	const secretAccessKey = queryParameters.get("secretAccessKey");
	const bucket = queryParameters.get("bucket");

	if (region === null || accessKeyId === null || secretAccessKey === null || bucket === null) {
		return (
			<ErrorBoundary fallbackRender={fallbackRender}>
				<div className="App">
					<InputForm region={region} accessKeyId={accessKeyId} secretAccessKey={secretAccessKey} bucket={bucket} />
				</div>
			</ErrorBoundary>
		);
	}

	const client = new S3Client({
		region: region,
		credentials: {
			accessKeyId: accessKeyId,
			secretAccessKey: secretAccessKey,
		},
	});

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
