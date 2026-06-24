package com.cyuzuzo.backend.model;

import org.springframework.core.io.Resource;
import org.springframework.http.MediaType;

public record ClaimAttachmentDownload(Resource resource, String filename, MediaType contentType) {
}
