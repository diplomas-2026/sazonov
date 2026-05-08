package com.github.danbel.sazonovapi.controller;

import com.github.danbel.sazonovapi.domain.AdmissionApplication;
import com.github.danbel.sazonovapi.domain.ApplicationDocument;
import com.github.danbel.sazonovapi.domain.DocumentType;
import com.github.danbel.sazonovapi.dto.ApplicationCreateRequest;
import com.github.danbel.sazonovapi.dto.ApplicationResponse;
import com.github.danbel.sazonovapi.dto.ApplicationUpdateRequest;
import com.github.danbel.sazonovapi.service.ApiMapper;
import com.github.danbel.sazonovapi.service.ApplicationService;
import jakarta.validation.Valid;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@RequestMapping("/applicant")
public class ApplicantController {

    private final ApplicationService applicationService;

    @GetMapping("/applications")
    public List<ApplicationResponse> myApplications(Authentication authentication) {
        return applicationService.listForCurrentUser(authentication).stream()
            .map(ApiMapper::applicationResponse)
            .toList();
    }

    @PostMapping("/applications")
    public ApplicationResponse create(Authentication authentication, @Valid @RequestBody ApplicationCreateRequest request) {
        AdmissionApplication application = applicationService.createApplication(authentication, request);
        return ApiMapper.applicationResponse(application);
    }

    @GetMapping("/applications/{id}")
    public ApplicationResponse one(Authentication authentication, @PathVariable Long id) {
        return ApiMapper.applicationResponse(applicationService.getApplication(authentication, id));
    }

    @PutMapping("/applications/{id}")
    public ApplicationResponse update(Authentication authentication,
                                      @PathVariable Long id,
                                      @Valid @RequestBody ApplicationUpdateRequest request) {
        return ApiMapper.applicationResponse(applicationService.updateApplication(authentication, id, request));
    }

    @PostMapping("/applications/{id}/cancel")
    public ApplicationResponse cancel(Authentication authentication, @PathVariable Long id) {
        return ApiMapper.applicationResponse(applicationService.cancelApplication(authentication, id));
    }

    @PostMapping(value = "/applications/{id}/documents", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApplicationResponse upload(Authentication authentication,
                                      @PathVariable Long id,
                                      @RequestPart("file") MultipartFile file,
                                      @RequestParam("type") DocumentType type) {
        applicationService.uploadDocument(authentication, id, type, file);
        return ApiMapper.applicationResponse(applicationService.getApplication(authentication, id));
    }

    @GetMapping("/documents/{documentId}")
    public ResponseEntity<ByteArrayResource> download(Authentication authentication, @PathVariable Long documentId) {
        ApplicationDocument document = applicationService.getDocument(authentication, documentId);
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(document.getContentType()));
        headers.setContentDisposition(ContentDisposition.attachment().filename(document.getFileName()).build());
        return ResponseEntity.ok().headers(headers).body(new ByteArrayResource(document.getData()));
    }

    @DeleteMapping("/documents/{documentId}")
    public ApplicationResponse delete(Authentication authentication, @PathVariable Long documentId) {
        ApplicationDocument deleted = applicationService.deleteDocument(authentication, documentId);
        return ApiMapper.applicationResponse(applicationService.getApplication(authentication, deleted.getApplication().getId()));
    }
}
