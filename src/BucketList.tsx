import { useEffect, useState, useContext } from "react";
import { useErrorBoundary } from "react-error-boundary";
import {
	ListObjectsCommand,
	ListObjectsCommandOutput,
	PutObjectCommand,
} from "@aws-sdk/client-s3";
import FileItem from "./FileItem.tsx";
import ClientContext from "./ClientContext.tsx";
import RefreshListingContext from "./RefreshListingContext.tsx";
import "./BucketList.css";


export default function BucketList(props: { bucket: string }) {
	const [objects, setObjects] = useState<
		Required<ListObjectsCommandOutput>["Contents"] | undefined
	>(undefined);
	const [selected, setSelected] = useState<Array<string>>([]);
	const [uploading, setUploading] = useState(false);
	const client = useContext(ClientContext);
	const { showBoundary } = useErrorBoundary();

	function refreshListing() {
		setObjects([]);
		if (client === undefined) {
			return;
		}
		const command = new ListObjectsCommand({ Bucket: props.bucket });
		client.send(command).then((response) => {
			setObjects(response.Contents || []);
		}).catch((e) => {
			showBoundary(e);
		});
	}
	useEffect(refreshListing, [props.bucket, client]);

	async function uploadItems() {
		if (client === undefined || uploading) {
			return;
		}
		setUploading(true);

		try {
			const files: Array<FileSystemFileHandle> = await window.showOpenFilePicker({
				multiple: true
			});
			const uploads = files.map(async (file) => {
				try {
					const fileData = await file.getFile();
					const input = {
						"Body": fileData,
						"Bucket": props.bucket,
						"Key": file.name
					};
					await client.send(new PutObjectCommand(input));
					return { name: file.name, error: null };
				} catch (error: any) {
					return { name: file.name, error: error };
				}
			});
			for (const upload of uploads) {
				const { name, error } = await upload;
				if (error) {
					console.error(error, error.stack);
					alert(`Failed to upload object '${name}': ${error.name}`);
				}
			}
			refreshListing();
		} catch (error: any) {
			console.error(error, error.stack);
		}
		setUploading(false);
	}

	if (objects === undefined) {
		return (
			<h3>Loading bucket '{props.bucket}' listing...</h3>
		);
	} else if (objects.length < 1) {
		return (
			<>
				<h3>Bucket '{props.bucket}' is empty</h3>
				<button>Upload Items</button>
			</>
		);
	} else {
		const numSelected = selected.length;
		return (
			<RefreshListingContext.Provider value={refreshListing}>
				<h3>{objects.length} file{objects.length !== 1 ? "s": ""} in bucket '{props.bucket}':</h3>
				<table>
					<thead>
						<tr>
							<th></th>
							<th>
								Name
							</th>
							<th>
								View
							</th>
							<th>
								Download
							</th>
							<th>
								Delete
							</th>
						</tr>
						<tr id="selectedRow">
							<td><input type="checkbox" name="all_items" /></td>
							<td data-active={numSelected > 0}>Selected ({numSelected})</td>
							<td>&#128065;</td>
							<td>&#128427;</td>
							<td>&#10060;</td>
						</tr>
					</thead>
					<tbody>
						{objects.map((o) => {
							return (
								<tr key={o.Key!}>
									<FileItem bucket={props.bucket} name={o.Key!} />
								</tr>
							);
						})}
					</tbody>
				</table>
				<button onClick={uploadItems} disabled={uploading}>Upload Items</button>
			</RefreshListingContext.Provider>
		);
	}
}