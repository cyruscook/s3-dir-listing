import { ErrorBoundary } from "react-error-boundary";
import InputForm from "./InputForm.tsx";
import "./App.css";
import AmplifyBucketList from "./AmplifyBucketList.tsx";

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
	const readonly = queryParameters.has("readonly");

	if (region === null || accessKeyId === null || secretAccessKey === null || bucket === null) {
		return (
			<ErrorBoundary fallbackRender={fallbackRender}>
				<div className="App">
					<InputForm region={region} accessKeyId={accessKeyId} secretAccessKey={secretAccessKey} bucket={bucket} />
				</div>
			</ErrorBoundary>
		);
	}

	return (
		<ErrorBoundary fallbackRender={fallbackRender}>
			<div className="App">
				<AmplifyBucketList bucket={bucket} readonly={readonly} region={region} accessKeyId={accessKeyId} secretAccessKey={secretAccessKey} />
			</div>
		</ErrorBoundary>
	);
}
