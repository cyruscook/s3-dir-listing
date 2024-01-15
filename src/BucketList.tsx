import { useEffect, useState, useContext } from "react";
import { useErrorBoundary } from "react-error-boundary";
import {
	GetObjectCommand,
	DeleteObjectCommand,
	ListObjectsCommand,
	PutObjectCommand,
	S3Client,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import JSZip from "jszip";
import FileItem from "./FileItem.tsx";
import FileItemSelected from "./FileItemSelected.tsx";
import ClientContext from "./ClientContext.tsx";
import RefreshListingContext from "./RefreshListingContext.tsx";
import "./BucketList.css";

export default function BucketList(props: { bucket: string, readonly: boolean }) {
	const [objects, setObjects] = useState<Array<string>>();
	const [urls, setUrls] = useState<Required<Map<string, string>>>(new Map());
	const [urlPromises, setUrlPromises] = useState<Required<Map<string, Promise<string>>>>(new Map());
	const [selected, setSelected] = useState<Required<Set<string>>>(new Set());
	const [downloading, setDownloading] = useState<Required<Set<string>>>(new Set());
	const [uploading, setUploading] = useState(false);
	const client = useContext(ClientContext);
	const { showBoundary } = useErrorBoundary();

	// Retrieves the list of objects in the S3 bucket
	function refreshListing() {
		setObjects(undefined);
		if (client === undefined) {
			return;
		}
		const command = new ListObjectsCommand({ Bucket: props.bucket });
		client.send(command).then((response) => {
			const contents = response.Contents;
			let newObjects: string[] = [];
			if (contents) {
				newObjects = contents.map(file => file.Key!);
			}
			setObjects(newObjects);
			setUrls(new Map());
			setSelected(new Set());
			setDownloading(new Set());

			// Now retrieve URLs for each object
			const promises = new Map();
			for (const object of newObjects) {
				promises.set(object, (async (object) => {
					try {
						const command = new GetObjectCommand({
							Bucket: props.bucket,
							Key: object
						});
						const url = await getSignedUrl(client, command, { expiresIn: 3600 });
						setUrls(new Map(urls.set(object, url)));
						return url;
					} catch (e) {
						showBoundary(e);
					}
				})(object));
			}
			setUrlPromises(promises);
		}).catch((e) => {
			showBoundary(e);
		});
	}
	useEffect(refreshListing, [props.bucket, client]);

	// Uploads a new item to the S3 bucket
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
				{props.readonly ? <></> : <button onClick={uploadItems} disabled={uploading}>Upload Items</button>}
			</>
		);
	} else {
		function toggleObjectSelected(object: string) {
			if (selected.delete(object)) {
				setSelected(new Set(selected));
			} else {
				setSelected(new Set(selected.add(object)));
			}
		}
		async function openSelected() {
			Array.from(selected).forEach(async (object) => {
				const url = await urlPromises.get(object);
				window.open(url, '_blank');
			});
		}
		async function downloadObjects(objects: string[]) {
			if (client === undefined) {
				return;
			}

			// Add downloading status to any objects we're downloading - don't download any already being downloaded
			const nobjects = [];
			for (const object of objects) {
				if (!downloading.has(object)) {
					setDownloading(new Set(downloading.add(object)));
					nobjects.push(object);
				}
			}
			objects = nobjects;

			async function getObjectBytes(client: S3Client, bucket: string, object: string) {
				const data = await client.send(new GetObjectCommand({ Bucket: bucket, Key: object }));
				const bytes = await data.Body.transformToByteArray();
				console.log("Loaded " + data.ContentLength + " bytes of " + object);
				return bytes;
			}

			if (objects.length > 1) {
				// Multiple objects - download as zip
				const savePromise: Promise<FileSystemFileHandle> = window.showSaveFilePicker({
					suggestedName: props.bucket + ".zip"
				});
				const zip = new JSZip();
				const promises = objects.map((object) => {
					return getObjectBytes(client, props.bucket, object)
						.then((bytes) => {
							zip.file(object, bytes);
						})
						.catch((e) => {
							showBoundary(e);
						});
				});
				const handle = await savePromise;
				for (const promise of promises) {
					await promise;
				}
				const blob = await zip.generateAsync({type:"blob"});
				const writable = await handle.createWritable();
				await writable.write(blob);
				await writable.close();
				objects.forEach(downloading.delete, downloading);
				setDownloading(new Set(downloading));
			} else {
				// One object - just download it
				const object = objects.pop()!;
				try {
					const savePromise: Promise<FileSystemFileHandle> = window.showSaveFilePicker({
						suggestedName: object
					});
					try {
						const bytes = await getObjectBytes(client, props.bucket, object);
						const handle = await savePromise;
						const writable = await handle.createWritable();
						await writable.write(bytes);
						await writable.close();
					} catch (error: any) {
						console.error(error, error.stack);
						alert(`Failed to download object: ${error.name}`);
					}
					downloading.delete(object);
					setDownloading(new Set(downloading));
				} catch (error: any) {
					console.error(error, error.stack);
					alert(`Failed to download object '${object}': ${error.name}`);
				}
			}
		}

		async function deleteObjects(objects: string[]) {
			if (client === undefined) {
				return;
			}
	
			const objstr = "'" + objects.join("', '") + "'";
			if (window.confirm(`Do you really want to delete '${objstr}'?`)) {
				const deletions = objects.map(async (object) => {
					try {
						await client.send(new DeleteObjectCommand({ Bucket: props.bucket, Key: object }));
					} catch (error: any) {
						console.error(error, error.stack);
						alert(`Failed to delete object: ${error.name}`);
					}
				});
				for (const deletion of deletions) {
					await deletion;
					refreshListing();
				}
			}
		}

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
							{props.readonly ? <></> : <th>
								Delete
							</th>}
						</tr>
						<tr id="selectedRow">
							<FileItemSelected
								objects={objects}
								selected={selected}
								bucket={props.bucket}
								open={openSelected}
								setSelected={(selected: Set<string>) => setSelected(selected)}
								downloading={Array.from(selected).filter(o => !downloading.has(o)).length <= 0}
								download={() => downloadObjects(Array.from(selected))}
								delete={() => deleteObjects(Array.from(selected))}
								readonly={props.readonly}
							/>
						</tr>
					</thead>
					<tbody>
						{objects.map((o) => {
							return (
								<tr key={o}>
									<FileItem
										selected={selected.has(o)}
										bucket={props.bucket}
										name={o}
										url={urls.get(o)}
										toggleSelected={() => toggleObjectSelected(o)}
										downloading={downloading.has(o)}
										download={() => downloadObjects([o])}
										delete={() => deleteObjects([o])}
										readonly={props.readonly}
									/>
								</tr>
							);
						})}
					</tbody>
				</table>
				{props.readonly ? <></> : <button onClick={uploadItems} disabled={uploading}>Upload Items</button>}
			</RefreshListingContext.Provider>
		);
	}
}