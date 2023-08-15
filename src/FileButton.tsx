import { useEffect, useState, useContext } from 'react';
import { useErrorBoundary } from "react-error-boundary";
import ClientContext from "./ClientContext.tsx";
import {
	GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default function FileButton(props: { bucket: string, name: string }) {
	const client = useContext(ClientContext);
	const [url, setUrl] = useState<string | undefined>(undefined);
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

	if (url !== undefined) {
		return (
			<a href={url}>
				{props.name}
			</a>
		);
	} else {
		return (
			<a>
				{props.name}
			</a>
		);
	}
}