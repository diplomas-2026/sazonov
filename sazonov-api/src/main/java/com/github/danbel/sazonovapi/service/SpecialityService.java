package com.github.danbel.sazonovapi.service;

import com.github.danbel.sazonovapi.domain.Speciality;
import com.github.danbel.sazonovapi.dto.SpecialityUpsertRequest;
import com.github.danbel.sazonovapi.repository.SpecialityRepository;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class SpecialityService {

    private final SpecialityRepository specialityRepository;

    public List<Speciality> list() {
        return specialityRepository.findAll().stream()
            .sorted((a, b) -> a.getCode().compareToIgnoreCase(b.getCode()))
            .toList();
    }

    public Speciality create(SpecialityUpsertRequest request) {
        Speciality speciality = new Speciality();
        apply(speciality, request);
        return specialityRepository.save(speciality);
    }

    public Speciality update(Long id, SpecialityUpsertRequest request) {
        Speciality speciality = specialityRepository.findById(id)
            .orElseThrow(() -> new IllegalArgumentException("Направление не найдено"));
        apply(speciality, request);
        return specialityRepository.save(speciality);
    }

    public void delete(Long id) {
        specialityRepository.deleteById(id);
    }

    private void apply(Speciality speciality, SpecialityUpsertRequest request) {
        speciality.setCode(request.code());
        speciality.setName(request.name());
        speciality.setDescription(request.description());
        speciality.setBudgetPlaces(request.budgetPlaces());
        speciality.setPaidPlaces(request.paidPlaces());
        speciality.setAdmissionPlan(request.admissionPlan());
    }
}
