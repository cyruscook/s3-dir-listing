import { useState, FormEvent } from "react";
import "./InputForm.css";


export default function InputForm(props: { region: string | null, accessKeyId: string | null, secretAccessKey: string | null, bucket: string | null }) {
    const [error, setError] = useState<string | null>(null);

    function submit(event: FormEvent) {
        event.preventDefault();
        const formData = new FormData(event.target as HTMLFormElement);
        const { region, accessKeyId, secretAccessKey, bucket } = Object.fromEntries(formData);
        if (!region) {
            setError("Invalid Bucket Region");
        } else if (!accessKeyId) {
            setError("Invalid Access Key ID");
        } else if (!secretAccessKey) {
            setError("Invalid Secret Access Key");
        } else if (!bucket) {
            setError("Invalid Bucket");
        } else {
            const url = new URL(window.location.href);
            url.searchParams.set("region", region as string);
            url.searchParams.set("accessKeyId", accessKeyId as string);
            url.searchParams.set("secretAccessKey", secretAccessKey as string);
            url.searchParams.set("bucket", bucket as string);
            window.history.pushState({ path: url.href }, '', url.href);
            window.history.go();
        }
    }

    return (
        <>
            {error && <p>{error}</p>}
            <form className="inputform" onSubmit={submit}>
                <label>
                    Bucket Region:
                    <br />
                    <input type="text" name="region" value={props.region ?? undefined} required />
                </label>

                <label>
                    Access Key ID:
                    <br />
                    <input type="text" name="accessKeyId" value={props.accessKeyId ?? undefined} required />
                </label>

                <label>
                    Secret Access Key:
                    <br />
                    <input type="text" name="secretAccessKey" value={props.secretAccessKey ?? undefined} required />
                </label>

                <label>
                    Bucket:
                    <br />
                    <input type="text" name="bucket" value={props.bucket ?? undefined} required />
                </label>

                <button type="submit">Submit</button>
            </form>
        </>
    );
}