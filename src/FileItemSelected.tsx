export default function FileItem(props: { objects: string[], selected: Set<string>, bucket: string, setSelected: (selected: Set<string>) => void, open: () => void, downloading: boolean, download: () => void, delete: () => void }) {
    const numSelected = props.selected.size;
    const numObjects = props.objects.length;
    function toggleAll() {
        const checked = numSelected >= numObjects;
        if (checked) {
            props.setSelected(new Set());
        } else {
            props.setSelected(new Set(props.objects));
        }
    }

	return (
		<>
            <td><input type="checkbox" name="all_items" checked={numSelected >= numObjects} onChange={toggleAll} /></td>
            <td data-active={numSelected > 0}>Selected ({numSelected})</td>
            <td><button className="filebtn" disabled={props.selected.size <= 0} onClick={props.open}>&#128065;</button></td>
            <td><button className="filebtn" disabled={props.downloading} onClick={props.download}>&#128427;</button></td>
            <td><button className="filebtn deletebtn" disabled={props.selected.size <= 0} onClick={props.delete}>&#10060;</button></td>
		</>
	);
}