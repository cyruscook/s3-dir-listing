import { useEffect, useState, useContext } from "react";
import { useErrorBoundary } from "react-error-boundary";
import {
	ListObjectsCommand,
	ListObjectsCommandOutput,
} from "@aws-sdk/client-s3";
import FileButton from "./FileButton.tsx";
import ClientContext from "./ClientContext.tsx";


export default function BucketList(props: { bucket: string }) {
	const [objects, setObjects] = useState<
		Required<ListObjectsCommandOutput>["Contents"]
	>([]);
	const client = useContext(ClientContext);
	const { showBoundary } = useErrorBoundary();

	useEffect(() => {
		if (client === undefined) {
			return;
		}
		const command = new ListObjectsCommand({ Bucket: props.bucket });
		client.send(command).then((response) => {
			setObjects(response.Contents || []);
			console.log(response);
		}).catch((e) => {
			showBoundary(e);
		});
	}, [props.bucket, client]);

	return (
		<>
			<h3>{objects.length} file{objects.length !== 1 ? "s": ""} in bucket '{props.bucket}':</h3>
			<ul>
				{objects.map((o) => (
					<li key={o.ETag}>
						<FileButton bucket={props.bucket} name={o.Key!} />
					</li>
				))}
			</ul>
		</>
	);
}