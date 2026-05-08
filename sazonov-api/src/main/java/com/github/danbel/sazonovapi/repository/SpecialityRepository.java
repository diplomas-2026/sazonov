package com.github.danbel.sazonovapi.repository;

import com.github.danbel.sazonovapi.domain.Speciality;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface SpecialityRepository extends JpaRepository<Speciality, Long> {

    Optional<Speciality> findByCode(String code);

    long countByDepartmentId(Long departmentId);
}
