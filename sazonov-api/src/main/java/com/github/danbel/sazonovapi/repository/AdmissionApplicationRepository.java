package com.github.danbel.sazonovapi.repository;

import com.github.danbel.sazonovapi.domain.AdmissionApplication;
import com.github.danbel.sazonovapi.domain.ApplicationStatus;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AdmissionApplicationRepository extends JpaRepository<AdmissionApplication, Long> {

    List<AdmissionApplication> findByApplicantUsernameOrderByCreatedAtDesc(String username);

    List<AdmissionApplication> findByStatusOrderByCreatedAtDesc(ApplicationStatus status);

    boolean existsByApplicantUsernameAndSpecialityId(String username, Long specialityId);

    boolean existsByApplicantUsernameAndSpecialityIdAndIdNot(String username, Long specialityId, Long id);
}
