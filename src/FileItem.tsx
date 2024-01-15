import { useEffect, useState, useContext } from 'react';
import { useErrorBoundary } from "react-error-boundary";
import { GetObjectCommand, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import ClientContext from "./ClientContext.tsx";
import RefreshListingContext from "./RefreshListingContext.tsx";
import "./FileItem.css";


export default function FileItem(props: { selected: boolean, bucket: string, name: string, toggleSelected: () => void }) {
	const client = useContext(ClientContext);
	const refreshListing = useContext(RefreshListingContext);
	const [url, setUrl] = useState<string | undefined>(undefined);
	const [downloading, setDownloading] = useState(false);
	const { showBoundary } = useErrorBoundary();

	useEffect(() => {
		if (client === undefined) {
			return;
		}
		const command = new GetObjectCommand({
			Bucket: props.bucket,
			Key: props.name
		});
		getSignedUrl(client, command, { expiresIn: 3600 }).then((url) => {
			setUrl(url);
		}).catch((e) => {
			showBoundary(e);
		});
	}, [client, props.bucket, props.name]);

	async function downloadObject() {
		if (client === undefined || downloading) {
			return;
		}
		setDownloading(true);

		const savePromise: Promise<FileSystemFileHandle> = window.showSaveFilePicker({
			suggestedName: props.name
		});
		try {
			const data = await client.send(new GetObjectCommand({ Bucket: props.bucket, Key: props.name }));
			const bytes = await data.Body.transformToByteArray();
			console.log("Loaded " + data.ContentLength + " bytes");
			const handle = await savePromise;
			const writable = await handle.createWritable();
			await writable.write(bytes);
			await writable.close();
		} catch (error: any) {
			console.error(error, error.stack);
			alert(`Failed to download object: ${error.name}`);
		}
		setDownloading(false);
	};

	async function deleteObject() {
		if (client === undefined) {
			return;
		}

		if (window.confirm(`Do you really want to delete '${props.name}'?`)) {
			try {
				await client.send(new DeleteObjectCommand({ Bucket: props.bucket, Key: props.name }));
				refreshListing();
			} catch (error: any) {
				console.error(error, error.stack);
				alert(`Failed to delete object: ${error.name}`);
			}
		}
	};

	return (
		<>
			<td><input type="checkbox" onChange={props.toggleSelected} checked={props.selected} /></td>
			<td>
				{props.name}
			</td>
			<td>{url ? <a href={url}><button className="filebtn">&#128065;</button></a> : <></>}</td>
			<td><button className="filebtn" data-downloading={downloading} onClick={downloadObject}>&#128427;</button></td>
			<td><button className="filebtn deletebtn" onClick={deleteObject}>&#10060;</button></td>
		</>
	);
}