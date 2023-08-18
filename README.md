# S3 Directory Listing

A simple S3 Directory Listing react app which works without requiring any public access by generating pre-signed URLs for any files.

An example listing, for a bucket which has block all public access enabled, can be seen here: https://cyruscook.github.io/s3-dir-listing/?bucket=dirlistingexample&region=eu-west-1&accessKeyId=%41%4b%49%41%32%4c%36%55%49%59%41%34%56%55%43%49%43%4c%4f%50&secretAccessKey=%42%66%79%76%47%4c%64%79%43%36%67%47%70%44%50%44%79%6b%6c%7a%79%6c%75%52%37%56%2b%58%48%61%50%64%62%79%42%66%69%49%53%30

## Usage

This repository has a GitHub Pages site which can be used as the s3 browser.

1. Update the S3 bucket's CORS policy to be the following:
```JSON
[
    {
        "AllowedHeaders": [
            "*"
        ],
        "AllowedMethods": [
            "GET"
        ],
        "AllowedOrigins": [
            "https://cyruscook.github.io"
        ],
        "ExposeHeaders": []
    }
]
```
2. Create a new IAM user to be used with the browser
3. Attach the following inline policy to the user:

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

4. Generate an access key for the user
5. You can use the following URL as the directory listing, replacing the relevant query parameters (**make sure you URL encode the parameters, paticularly the access key secret**):

```
https://cyruscook.github.io/s3-dir-listing/?bucket=[S3_BUCKET_NAME]&region=[S3_BUCKET_REGION]&accessKeyId=[IAM_ACCESS_KEY_ID]&secretAccessKey=[IAM_ACCESS_KEY_SECRET]
```

Alternatively, you can also host the website yourself.
The latest index.html can be downloaded by going to Actions, selecting the latest action, and downloading `index.html` from the Artifacts list.
