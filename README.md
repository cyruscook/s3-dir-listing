# S3 Directory Listing

A simple S3 Directory Listing react app which works without requiring any public access by generating pre-signed URLs for any files.

## Usage

This repository has a GitHub Pages site which can be used as the s3 browser.

1. Create a new IAM user to be used with the browser
2. Attach the following inline policy to the user:

```JSON
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Sid": "VisualEditor0",
            "Effect": "Allow",
            "Action": [
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "arn:aws:s3:::[S3_BUCKET_NAME]",
                "arn:aws:s3:::[S3_BUCKET_NAME]/*"
            ]
        }
    ]
}
```

3. Generate an access key for the user
4. You can use the following URL as the directory listing, replacing the relevant query parameters (**make sure you URL encode the parameters, paticularly the access key secret**): http://github.com/?bucket=[S3_BUCKET_NAME]&region=[S3_BUCKET_REGION]&accessKeyId=[IAM_ACCESS_KEY_ID]&secretAccessKey=[IAM_ACCESS_KEY_SECRET]

Alternatively, you can also host the website yourself.
The latest index.html can be downloaded by going to Actions, selecting the latest action, and downloading `index.html` from the Artifacts list.
