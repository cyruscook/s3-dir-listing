import { useContext } from 'react';
import { useErrorBoundary } from "react-error-boundary";
import ClientContext from "./ClientContext.tsx";
import {
	GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export default function FileButton(props: { bucket: string, name: string }) {
	const client = useContext(ClientContext);
	const { showBoundary } = useErrorBoundary();

	function handleClick(e: {preventDefault: () => void}) {
		e.preventDefault();

		if (client === undefined) {
			return;
		}
		const command = new GetObjectCommand({
			Bucket: props.bucket,
			Key: props.name
		});
		getSignedUrl(client, command, { expiresIn: 3600 }).then((url) => {
			window.open(url, "_self")
		}).catch((e) => {
			showBoundary(e);
		});
	}

	return (
		<a href="#" onClick={handleClick}>
			{props.name}
		</a>
	);
}