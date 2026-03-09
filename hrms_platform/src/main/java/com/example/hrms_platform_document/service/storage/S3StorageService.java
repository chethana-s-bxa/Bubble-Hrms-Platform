package com.example.hrms_platform_document.service.storage;

import com.example.hrms_platform_document.exception.StorageOperationException;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.CopyObjectRequest;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.HeadObjectRequest;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Request;
import software.amazon.awssdk.services.s3.model.ListObjectsV2Response;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.model.S3Object;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

import java.net.URL;
import java.time.Duration;

@Service
public class S3StorageService implements StorageService {

    private final S3Client s3Client;
    private final S3Presigner s3Presigner;

    @Value("${aws.s3.bucket}")
    private String bucket;

    public S3StorageService(S3Client s3Client, S3Presigner s3Presigner) {
        this.s3Client = s3Client;
        this.s3Presigner = s3Presigner;
    }

    /**
     * Upload file to STAGING area
     */
    @Override
    public String uploadToStaging(MultipartFile file, String key) {
        try {
            PutObjectRequest request = PutObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .contentType(file.getContentType())
                    .build();

            s3Client.putObject(
                    request,
                    RequestBody.fromBytes(file.getBytes())
            );

            return key;
        } catch (Exception e) {
            throw new StorageOperationException(
                    "Failed to upload file to S3 staging area",
                    e
            );
        }
    }

    /**
     * Move file from STAGING → VERIFIED
     */
    @Override
    public void moveToVerified(String stagingKey, String verifiedKey) {
        try {
            CopyObjectRequest copyRequest = CopyObjectRequest.builder()
                    .sourceBucket(bucket)
                    .sourceKey(stagingKey)
                    .destinationBucket(bucket)
                    .destinationKey(verifiedKey)
                    .build();

            s3Client.copyObject(copyRequest);

            delete(stagingKey);

        } catch (Exception e) {
            throw new StorageOperationException(
                    "Failed to move file from staging to verified",
                    e
            );
        }
    }

    /**
     * Delete object from S3
     */
    @Override
    public void delete(String key) {
        try {
            DeleteObjectRequest deleteRequest = DeleteObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            s3Client.deleteObject(deleteRequest);
        } catch (Exception e) {
            throw new StorageOperationException(
                    "Failed to delete S3 object",
                    e
            );
        }
    }

    /**
     * Generate secure presigned URL for download
     */
    @Override
    @org.springframework.cache.annotation.Cacheable(cacheNames = "presignedUrlByKey", key = "#key")
    public String generatePresignedUrl(String key) {
        try {
            GetObjectRequest getObjectRequest = GetObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();

            GetObjectPresignRequest presignRequest =
                    GetObjectPresignRequest.builder()
                            .signatureDuration(Duration.ofMinutes(10))
                            .getObjectRequest(getObjectRequest)
                            .build();

            URL presignedUrl =
                    s3Presigner.presignGetObject(presignRequest).url();

            return presignedUrl.toString();

        } catch (Exception e) {
            throw new StorageOperationException(
                    "Failed to generate presigned URL",
                    e
            );
        }
    }

    @Override
    public boolean exists(String key) {
        try {
            HeadObjectRequest request = HeadObjectRequest.builder()
                    .bucket(bucket)
                    .key(key)
                    .build();
            s3Client.headObject(request);
            return true;
        } catch (Exception e) {
            return false;
        }
    }

    @Override
    public String findLatestKey(String prefix) {
        String continuation = null;
        S3Object latest = null;

        do {
            ListObjectsV2Request request = ListObjectsV2Request.builder()
                    .bucket(bucket)
                    .prefix(prefix)
                    .continuationToken(continuation)
                    .build();
            ListObjectsV2Response response = s3Client.listObjectsV2(request);

            for (S3Object obj : response.contents()) {
                if (latest == null || obj.lastModified().isAfter(latest.lastModified())) {
                    latest = obj;
                }
            }

            continuation = response.isTruncated() ? response.nextContinuationToken() : null;
        } while (continuation != null);

        return latest != null ? latest.key() : null;
    }
}

