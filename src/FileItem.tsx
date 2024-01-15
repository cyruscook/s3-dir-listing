import { useEffect, useContext } from 'react';
import ClientContext from "./ClientContext.tsx";


export default function FileItem(props: { selected: boolean, bucket: string, name: string, url: string | undefined, toggleSelected: () => void, downloading: boolean, download: () => void, delete: () => void }) {
	const client = useContext(ClientContext);

	useEffect(() => {
		if (client === undefined) {
			return;
		}
	}, [client, props.bucket, props.name]);

	const viewbtn = <button className="filebtn" disabled={props.url === undefined}>&#128065;</button>;
	return (
		<>
			<td><input type="checkbox" onChange={props.toggleSelected} checked={props.selected} /></td>
			<td>
				{props.name}
			</td>
			<td>{props.url ? <a href={props.url}>{viewbtn}</a> : <>{viewbtn}</>}</td>
			<td><button className="filebtn" disabled={props.downloading} onClick={props.download}>&#128427;</button></td>
			<td><button className="filebtn deletebtn" onClick={props.delete}>&#10060;</button></td>
		</>
	);
}